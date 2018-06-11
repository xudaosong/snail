const moment = require('moment')
const mongoose = require('mongoose')
const { response } = require('../utils/require')
const _ = require('lodash')
const math = require('mathjs')
const Loan = mongoose.model('Loan')
const LoanReward = mongoose.model('LoanReward')
const Repayment = mongoose.model('Repayment')

// 根据不同的平台，计算小数位是否四舍五入
const decimal = function (amount, platform) {
  // 目前丁丁金服采用截取小数后三位，其它平台采用四舍五入法
  if (platform === '丁丁金服') {
    amount = _.floor(amount, 2)
  } else {
    amount = _.round(amount, 2)
  }
  return amount
}

// 按等额本息计算每期应还本金
const calcPrincipal = function (principal, interestRate, currentTerm, toalTerm, platform) {
  let monthInterest = interestRate / 12
  // 每月应还本金=贷款本金×月利率×(1+月利率)^(还款月序号-1)÷〔(1+月利率)^还款月数-1〕
  return decimal(principal * monthInterest * (1 + monthInterest) ** (currentTerm - 1) / ((1 + monthInterest) ** toalTerm - 1), platform)
}

// 按等额本息计算每期应还利息
const calcInterest = function (principal, interestRate, currentTerm, toalTerm, platform) {
  if (interestRate === 0) {
    return 0
  }
  let monthInterest = interestRate / 12
  // 每月应还利息=贷款本金×月利率×〔(1+月利率)^还款月数-(1+月利率)^(还款月序号-1)〕÷〔(1+月利率)^还款月数-1〕
  return decimal(principal * monthInterest * ((1 + monthInterest) ** toalTerm - (1 + monthInterest) ** (currentTerm - 1)) / ((1 + monthInterest) ** toalTerm - 1), platform)
}

// 平台加息奖励计算，如广信贷
const calcRewardInterest = function (principal, originalInterest, bonusInterest, toalTerm, platform) {
  // 计算方法为：每期加息金额 = (标面利息的总和-奖励加息后利息的总和)/总期数
  let originalInterestAmount = 0
  let bonusInterestAmount = 0
  // 获取标面总利息的总和
  for (let i = 1; i <= toalTerm; i++) {
    originalInterestAmount += calcInterest(principal, originalInterest, i, toalTerm, platform)
  }
  // 获取奖励加息后利息的总和
  for (let i = 1; i <= toalTerm; i++) {
    bonusInterestAmount += calcInterest(principal, originalInterest + bonusInterest, i, toalTerm, platform)
  }
  return (bonusInterestAmount - originalInterestAmount) / toalTerm
}

// 一次性还本付息计算
const calcOneTimeRepayment = function (principal, interestRate, term, termUnit) {
  let interest = null
  switch (termUnit) {
    case 'day':
      // 计算公式：利息 = 本金*利息/365*总期数
      interest = principal * interestRate / 365 * term
      break
    case 'month':
      // 计算公式：利息 = 本金*利息/12*总期数
      interest = principal * interestRate / 12 * term
      break
  }
  return interest
}

// 按月付息到期还本
const calcMonthlyPayment = function (principal, interestRate) {
  // 计算公式：利息 = 本金*利息/12
  return principal * interestRate / 12
}

exports.getList = async (ctx, next) => {
  const results = await Loan.getList()
  ctx.response.body = response(results)
}

exports.getRepaymentList = async (ctx, next) => {
  const results = await Repayment.getList({ loanId: ctx.request.query.loanId })
  ctx.response.body = response(results)
}

exports.add = async (ctx, next) => {
  let params = ctx.request.body
  params.platformReward = new LoanReward(params.platformReward)
  params.channelReward = new LoanReward(params.channelReward)
  const loan = new Loan(params)
  ctx.response.body = await loan.save().then(function (loan) {
    if (loan.repaymentMode === 1) { // 等额本息
      let repayments = []
      // 如果红包是按期返还，则计入每期回款
      let everyPlatformRedEnvelope = 0
      let everyChannelRedEnvelope = 0
      if (loan.channelReward.redEnvelopeType === 3) {
        everyChannelRedEnvelope = loan.channelReward.redEnvelope / loan.term
      }
      if (loan.platformReward.redEnvelopeType === 3) {
        everyPlatformRedEnvelope = loan.platformReward.redEnvelope / loan.term
      }
      // 每期还款计算
      for (let i = 1; i <= loan.term; i++) {
        // 标面回款计算
        let interest = calcInterest(loan.principal, loan.interestRate, i, loan.term, loan.platform)
        let principal = calcPrincipal(loan.principal, loan.interestRate, i, loan.term, loan.platform)
        let interestManagementFee = interest * loan.interestManagementFee
        // 平台奖励回款计算
        let platformRewardInterest = everyPlatformRedEnvelope
        switch (loan.platformReward.interestType) {
          case 1: // 等额本息
            platformRewardInterest += calcInterest(loan.principal, loan.platformReward.interestRateIncrease, i, loan.term, loan.platform)
            break
          case 2: // 第一期等额本息的利息做为后面每期的奖励，如365易贷的特权加息
            platformRewardInterest += calcInterest(loan.principal, loan.channelReward.interestRateIncrease, 1, loan.term, loan.platform)
            break
          case 3: // 等额本息固定利息，如广信贷
            platformRewardInterest += calcRewardInterest(loan.principal, loan.interestRate, loan.platformReward.interestRateIncrease, loan.term, loan.platform)
            break
        }
        let platformRewardFee = platformRewardInterest * loan.platformReward.interestManagementFee

        // 渠道奖励回款计算
        let channelRewardInterest = everyChannelRedEnvelope
        switch (loan.channelReward.interestType) {
          case 1: // 等额本息
            channelRewardInterest += calcInterest(loan.principal, loan.channelReward.interestRateIncrease, i, loan.term, loan.platform)
            break
          case 2: // 第一期等额本息的利息做为后面每期的奖励，如365易贷的特权加息
            channelRewardInterest += calcInterest(loan.principal, loan.channelReward.interestRateIncrease, 1, loan.term, loan.platform)
            break
          case 3: //  等额本息固定利息，如广信贷
            channelRewardInterest += calcRewardInterest(loan.principal, loan.interestRate, loan.platformReward.interestRateIncrease, loan.term, loan.platform)
            break
        }
        let channelRewardFee = channelRewardInterest * loan.channelReward.interestManagementFee
        // 还款小计
        let totalInterest = interest + platformRewardInterest + channelRewardInterest
        let totalInterestManagementFee = interestManagementFee + platformRewardFee + channelRewardFee
        let totalRepayment = principal + totalInterest
        let amountReceivable = totalRepayment - totalInterestManagementFee
        repayments.push(new Repayment({
          loan: loan._id,
          platform: loan.platform,
          period: i,
          principal,
          interest,
          interestManagementFee,
          platformRewardInterest,
          platformRewardFee,
          channelRewardInterest,
          channelRewardFee,
          repaymentDate: moment(loan.interestDate).add(i, 'months').format(),
          status: '待还款',
          totalInterest,
          totalInterestManagementFee,
          totalRepayment,
          amountReceivable
        }))
      }
      Repayment.insertMany(repayments).then(function (result) {
        loan.repayments = repayments
      })
    } else if (loan.repaymentMode === 2) { // 一次性还本付息
      let repayment = null
      // 本金计算
      let principal = loan.principal
      // 红包算入本金并计算利息
      if (loan.platformReward.redEnvelopeType === 2 && loan.platformReward.redEnvelope > 0) {
        principal += loan.platformReward.redEnvelope
      }
      if (loan.channelReward.redEnvelopeType === 2 && loan.channelReward.redEnvelope > 0) {
        principal += loan.channelReward.redEnvelope
      }
      // 利息计算
      let interest = calcOneTimeRepayment(principal, loan.interestRate, loan.term, loan.termUnit)
      let interestManagementFee = interest * loan.interestManagementFee
      let platformRewardInterest = calcOneTimeRepayment(principal, loan.platformReward.interestRateIncrease, loan.term, loan.termUnit)
      if (loan.platformReward.redEnvelopeType === 2 && loan.platformReward.redEnvelope > 0) {
        platformRewardInterest += loan.platformReward.redEnvelope
      }
      let platformRewardFee = platformRewardInterest * loan.platformReward.interestManagementFee
      let channelRewardInterest = calcOneTimeRepayment(principal, loan.channelReward.interestRateIncrease, loan.term, loan.termUnit)
      if (loan.channelReward.redEnvelopeType === 2 && loan.channelReward.redEnvelope > 0) {
        channelRewardInterest += loan.channelReward.redEnvelope
      }
      let channelRewardFee = channelRewardInterest * loan.channelReward.interestManagementFee
      // 还款小计
      let totalInterest = interest + platformRewardInterest + channelRewardInterest
      let totalInterestManagementFee = interestManagementFee + platformRewardFee + channelRewardFee
      let totalRepayment = loan.principal + totalInterest
      let amountReceivable = totalRepayment - totalInterestManagementFee
      repayment = new Repayment({
        loan: loan._id,
        period: 1,
        principal: loan.principal,
        interest,
        interestManagementFee,
        platformRewardInterest,
        platformRewardFee,
        channelRewardInterest,
        channelRewardFee,
        repaymentDate: moment(loan.interestDate).add(loan.term, loan.termUnit === 'day' ? 'days' : 'months').format(),
        status: '待还款',
        totalInterest,
        totalInterestManagementFee,
        totalRepayment,
        amountReceivable
      })
      repayment.save().then(function (result) {
        loan.repayments = [result]
      }).catch(function (err) {
        throw err
      })
    } else if (loan.repaymentMode === 3) { // 按月付息到期还本
      let repayments = []
      // 如果红包是按期返还，则计入每期回款
      let everyPlatformRedEnvelope = 0
      let everyChannelRedEnvelope = 0
      if (loan.channelReward.redEnvelopeType === 3) {
        everyChannelRedEnvelope = loan.channelReward.redEnvelope / loan.term
      }
      if (loan.platformReward.redEnvelopeType === 3) {
        everyPlatformRedEnvelope = loan.platformReward.redEnvelope / loan.term
      }
      // 每期还款计算
      for (let i = 1; i <= loan.term; i++) {
        // 标面回款计算
        let interest = calcMonthlyPayment(loan.principal, loan.interestRate)
        let principal = i === loan.term ? loan.principal : 0
        let interestManagementFee = interest * loan.interestManagementFee
        // 平台奖励回款计算
        let platformRewardInterest = everyPlatformRedEnvelope
        switch (loan.platformReward.interestType) {
          case 1: // 等额本息
            platformRewardInterest += calcInterest(loan.principal, loan.platformReward.interestRateIncrease, i, loan.term, loan.platform)
            break
          case 2: // 第一期等额本息的利息做为后面每期的奖励，如365易贷的特权加息
            platformRewardInterest += calcInterest(loan.principal, loan.channelReward.interestRateIncrease, 1, loan.term, loan.platform)
            break
          case 3: // 等额本息固定利息，如广信贷
            platformRewardInterest += calcRewardInterest(loan.principal, loan.interestRate, loan.platformReward.interestRateIncrease, loan.term, loan.platform)
            break
        }
        let platformRewardFee = platformRewardInterest * loan.platformReward.interestManagementFee

        // 渠道奖励回款计算
        let channelRewardInterest = everyChannelRedEnvelope
        switch (loan.channelReward.interestType) {
          case 1: // 等额本息
            channelRewardInterest += calcInterest(loan.principal, loan.channelReward.interestRateIncrease, i, loan.term, loan.platform)
            break
          case 2: // 第一期等额本息的利息做为后面每期的奖励，如365易贷的特权加息
            channelRewardInterest += calcInterest(loan.principal, loan.channelReward.interestRateIncrease, 1, loan.term, loan.platform)
            break
          case 3: //  等额本息固定利息，如广信贷
            channelRewardInterest += calcRewardInterest(loan.principal, loan.interestRate, loan.platformReward.interestRateIncrease, loan.term, loan.platform)
            break
        }
        let channelRewardFee = channelRewardInterest * loan.channelReward.interestManagementFee
        // 还款小计
        let totalInterest = interest + platformRewardInterest + channelRewardInterest
        let totalInterestManagementFee = interestManagementFee + platformRewardFee + channelRewardFee
        let totalRepayment = principal + totalInterest
        let amountReceivable = totalRepayment - totalInterestManagementFee
        repayments.push(new Repayment({
          loan: loan._id,
          period: i,
          principal,
          interest,
          interestManagementFee,
          platformRewardInterest,
          platformRewardFee,
          channelRewardInterest,
          channelRewardFee,
          repaymentDate: moment(loan.interestDate).add(i, 'months').format(),
          status: '待还款',
          totalInterest,
          totalInterestManagementFee,
          totalRepayment,
          amountReceivable
        }))
      }
      Repayment.insertMany(repayments).then(function (result) {
        loan.repayments = repayments
      })
    }
    return response(loan)
  }).catch(function (err) {
    return response({}, [err], 500)
  })
}

exports.import = async (ctx, next) => {
  let receipt = []
  ctx.request.body.forEach((item) => {
    receipt.push(new Receipt(item))
  })
}
