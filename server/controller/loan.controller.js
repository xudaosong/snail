const moment = require('moment')
const mongoose = require('mongoose')
const { response } = require('../utils/require')
// const { floatFixed } = require('../utils')
// const _ = require('lodash')
const Loan = mongoose.model('Loan')
const LoanReward = mongoose.model('LoanReward')
const Repayment = mongoose.model('Repayment')
const Decimal = require('../utils/decimal')

// 根据不同的平台，计算小数位是否四舍五入
const platformRound = function (amount, platform) {
  // 目前丁丁金服采用截取小数后2位，其它平台采用四舍五入法
  if (platform === '丁丁金服') {
    amount = new Decimal(amount).mul(100).floor().div(100)
  } else {
    amount = new Decimal(amount).mul(100).round().div(100)
  }
  return amount.toNumber()
}

// 按等额本息计算每期应还本金
// const calcPrincipal = function (principal, interestRate, currentTerm, toalTerm, platform) {
//   let monthInterest = interestRate / 12
//   // 每月应还本金=贷款本金×月利率×(1+月利率)^(还款月序号-1)÷〔(1+月利率)^还款月数-1〕
//   return decimal(principal * monthInterest * (1 + monthInterest) ** (currentTerm - 1) / ((1 + monthInterest) ** toalTerm - 1), platform)
// }

// 按等额本息计算每期应还利息
const calcInterest = function (principal, interestRate, currentTerm, toalTerm, platform) {
  if (interestRate === 0) {
    return 0
  }
  let monthInterest = new Decimal(interestRate).div(12)
  // 每月应还利息=贷款本金×月利率×〔(1+月利率)^还款月数-(1+月利率)^(还款月序号-1)〕÷〔(1+月利率)^还款月数-1〕
  return platformRound(new Decimal(principal).mul(monthInterest).mul(monthInterest.plus(1).pow(toalTerm).sub(monthInterest.plus(1).pow(currentTerm - 1))).div(monthInterest.plus(1).pow(toalTerm).sub(1)), platform)
}
// 按等额本息计算每期还款本息
const calcPrincipalAndInterest = function (principal, interestRate, currentTerm, toalTerm, platform) {
  // 易融恒信的计算规则：每月利息 = 每月本息 - 每月本金（截取2位数）
  let monthInterestRate = new Decimal(interestRate).div(12)
  // 每月月供额=〔贷款本金×月利率×(1＋月利率)＾还款月数〕÷〔(1＋月利率)＾还款月数-1〕
  let monthAmount = new Decimal(principal).mul(monthInterestRate).mul(monthInterestRate.plus(1).pow(toalTerm)).div(monthInterestRate.plus(1).pow(toalTerm).sub(1))
  // 每月应还本金=贷款本金×月利率×(1+月利率)^(还款月序号-1)÷〔(1+月利率)^还款月数-1〕
  let monthPrincipal = new Decimal(principal).mul(monthInterestRate).mul(monthInterestRate.plus(1).pow(currentTerm - 1)).div(monthInterestRate.plus(1).pow(toalTerm).sub(1))
  monthAmount = platformRound(monthAmount, platform)
  monthPrincipal = platformRound(monthPrincipal, platform)
  let monthInterest = platformRound(new Decimal(monthAmount).sub(monthPrincipal), platform)
  return {
    amount: monthAmount,
    principal: monthPrincipal,
    interest: monthInterest
  }
}
// 平台加息奖励计算，如广信贷
const calcRewardInterest = function (principal, originalInterest, bonusInterest, toalTerm, platform) {
  // 计算方法为：每期加息金额 = (标面利息的总和-奖励加息后利息的总和)/总期数
  let originalInterestAmount = new Decimal(0)
  let bonusInterestAmount = new Decimal(0)
  // 获取标面总利息的总和
  for (let i = 1; i <= toalTerm; i++) {
    originalInterestAmount = originalInterestAmount.plus(calcInterest(principal, originalInterest, i, toalTerm, platform))
  }
  // 获取奖励加息后利息的总和
  for (let i = 1; i <= toalTerm; i++) {
    bonusInterestAmount = bonusInterestAmount.plus(calcInterest(principal, originalInterest + bonusInterest, i, toalTerm, platform))
  }
  return platformRound(bonusInterestAmount.sub(originalInterestAmount).div(toalTerm))
}

// 一次性还本付息计算
const calcOneTimeRepayment = function (principal, interestRate, term, termUnit, platform) {
  let interest = null
  switch (termUnit) {
    case 1: // 按月
      // 计算公式：利息 = 本金*利息/12*总期数
      interest = new Decimal(principal).mul(interestRate).div(12).mul(term)
      break
    case 2: // 按日
      // 计算公式：利息 = 本金*利息/365*总期数
      interest = new Decimal(principal).mul(interestRate).div(365).mul(term)
      break
  }
  return platformRound(interest, platform)
}

// 按月付息到期还本
const calcMonthlyPayment = function (principal, interestRate) {
  // 计算公式：利息 = 本金*利息/12
  return platformRound(new Decimal(principal).mul(interestRate).div(12))
}

// 生成每期回款
const generateRepayment = function (loan) {
  let repayments = []
  if (loan.repaymentMode === 1) { // 等额本息
    // 如果红包是按期返还，则计入每期回款
    let everyPlatformRedEnvelope = 0
    let everyChannelRedEnvelope = 0
    if (loan.channelReward.redEnvelopeType === 3) {
      everyChannelRedEnvelope = platformRound(new Decimal(loan.channelReward.redEnvelope).div(loan.term))
    }
    if (loan.platformReward.redEnvelopeType === 3) {
      everyPlatformRedEnvelope = platformRound(new Decimal(loan.platformReward.redEnvelope).div(loan.term))
    }
    // 每期还款计算
    for (let i = 1; i <= loan.term; i++) {
      // 标面回款计算
      let { principal, interest } = calcPrincipalAndInterest(loan.principal, loan.interestRate, i, loan.term, loan.platform)
      // let interest = calcInterest(loan.principal, loan.interestRate, i, loan.term, loan.platform)
      // let principal = calcPrincipal(loan.principal, loan.interestRate, i, loan.term, loan.platform)
      let interestManagementFee = platformRound(new Decimal(interest).mul(loan.interestManagementFee))
      // 平台奖励回款计算
      let platformRewardInterest = new Decimal(everyPlatformRedEnvelope)
      if (loan.platformReward.interestRateIncrease > 0) {
        switch (loan.platformReward.interestType) {
          case 1: // 等额本息，如丁丁金服
            platformRewardInterest = platformRewardInterest.plus(calcInterest(loan.principal, loan.platformReward.interestRateIncrease, i, loan.term, loan.platform))
            break
          case 2: // 第一期等额本息的利息做为后面每期的奖励，如365易贷的特权加息
            platformRewardInterest = platformRewardInterest.plus(calcInterest(loan.principal, loan.platformReward.interestRateIncrease, 1, loan.term, loan.platform))
            break
          case 3: // 等额本息固定利息，如广信贷
            platformRewardInterest = platformRewardInterest.plus(calcRewardInterest(loan.principal, loan.interestRate, loan.platformReward.interestRateIncrease, loan.term, loan.platform))
            break
        }
      }
      let platformRewardFee = platformRound(new Decimal(platformRewardInterest).mul(loan.platformReward.interestManagementFee))

      // 渠道奖励回款计算
      let channelRewardInterest = new Decimal(everyChannelRedEnvelope)
      if (loan.channelReward.interestRateIncrease > 0) {
        switch (loan.channelReward.interestType) {
          case 1: // 等额本息
            channelRewardInterest = channelRewardInterest.plus(calcInterest(loan.principal, loan.channelReward.interestRateIncrease, i, loan.term, loan.platform))
            break
          case 2: // 第一期等额本息的利息做为后面每期的奖励，如365易贷的特权加息
            channelRewardInterest = channelRewardInterest.plus(calcInterest(loan.principal, loan.channelReward.interestRateIncrease, 1, loan.term, loan.platform))
            break
          case 3: //  等额本息固定利息，如广信贷
            channelRewardInterest = channelRewardInterest.plus(calcRewardInterest(loan.principal, loan.interestRate, loan.channelReward.interestRateIncrease, loan.term, loan.platform))
            break
        }
      }
      let channelRewardFee = platformRound(new Decimal(channelRewardInterest).mul(loan.channelReward.interestManagementFee))
      // 还款小计
      let totalInterest = new Decimal(platformRewardInterest).plus(channelRewardInterest).plus(interest)
      let totalInterestManagementFee = new Decimal(platformRewardFee).plus(channelRewardFee).plus(interestManagementFee)
      let totalRepayment = new Decimal(totalInterest).plus(principal)
      let amountReceivable = new Decimal(totalRepayment).sub(totalInterestManagementFee)
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
        status: 0,
        totalInterest,
        totalInterestManagementFee,
        totalRepayment,
        amountReceivable
      }))
    }
  } else if (loan.repaymentMode === 2) { // 一次性还本付息
    // 本金计算
    let principal = new Decimal(loan.principal)
    // 红包算入本金并计算利息
    if (loan.platformReward.redEnvelopeType === 2 && loan.platformReward.redEnvelope > 0) {
      principal = principal.plus(loan.platformReward.redEnvelope)
    }
    if (loan.channelReward.redEnvelopeType === 2 && loan.channelReward.redEnvelope > 0) {
      principal = principal.plus(loan.channelReward.redEnvelope)
    }
    // 利息计算
    let interest = calcOneTimeRepayment(principal, loan.interestRate, loan.term, loan.termUnit, loan.platform)
    let interestManagementFee = platformRound(new Decimal(interest).mul(loan.interestManagementFee))
    let platformRewardInterest = calcOneTimeRepayment(principal, loan.platformReward.interestRateIncrease, loan.term, loan.termUnit, loan.platform)
    if (loan.platformReward.redEnvelopeType === 2 && loan.platformReward.redEnvelope > 0) {
      platformRewardInterest = new Decimal(platformRewardInterest).plus(loan.platformReward.redEnvelope)
    }
    let platformRewardFee = platformRound(new Decimal(platformRewardInterest).mul(loan.platformReward.interestManagementFee))
    let channelRewardInterest = calcOneTimeRepayment(principal, loan.channelReward.interestRateIncrease, loan.term, loan.termUnit, loan.platform)
    if (loan.channelReward.redEnvelopeType === 2 && loan.channelReward.redEnvelope > 0) {
      channelRewardInterest = new Decimal(channelRewardInterest).plus(loan.channelReward.redEnvelope)
    }
    let channelRewardFee = platformRound(new Decimal(channelRewardInterest).mul(loan.channelReward.interestManagementFee))
    // 还款小计
    let totalInterest = new Decimal(interest).plus(platformRewardInterest).plus(channelRewardInterest)
    let totalInterestManagementFee = new Decimal(interestManagementFee).plus(platformRewardFee).plus(channelRewardFee)
    let totalRepayment = new Decimal(totalInterest).plus(loan.principal)
    let amountReceivable = new Decimal(totalRepayment).sub(totalInterestManagementFee)
    repayments.push(new Repayment({
      loan: loan._id,
      platform: loan.platform,
      period: 1,
      principal: loan.principal,
      interest,
      interestManagementFee,
      platformRewardInterest,
      platformRewardFee,
      channelRewardInterest,
      channelRewardFee,
      repaymentDate: moment(loan.interestDate).add(loan.term, loan.termUnit === 1 ? 'months' : 'days').format(),
      status: 0,
      totalInterest,
      totalInterestManagementFee,
      totalRepayment,
      amountReceivable
    }))
  } else if (loan.repaymentMode === 3) { // 按月付息到期还本
    // 如果红包是按期返还，则计入每期回款
    let everyPlatformRedEnvelope = 0
    let everyChannelRedEnvelope = 0
    if (loan.channelReward.redEnvelopeType === 3) {
      everyChannelRedEnvelope = platformRound(new Decimal(loan.channelReward.redEnvelope).div(loan.term))
    }
    if (loan.platformReward.redEnvelopeType === 3) {
      everyPlatformRedEnvelope = platformRound(new Decimal(loan.platformReward.redEnvelope).div(loan.term))
    }
    // 每期还款计算
    for (let i = 1; i <= loan.term; i++) {
      // 标面回款计算
      let interest = calcMonthlyPayment(loan.principal, loan.interestRate)
      let principal = i === loan.term ? loan.principal : 0
      let interestManagementFee = platformRound(new Decimal(interest).mul(loan.interestManagementFee))
      // 平台奖励回款计算
      let platformRewardInterest = everyPlatformRedEnvelope

      if (loan.platformReward.interestRateIncrease > 0) {
        switch (loan.platformReward.interestType) {
          case 1: // 等额本息
            platformRewardInterest = new Decimal(platformRewardInterest).plus(calcInterest(loan.principal, loan.platformReward.interestRateIncrease, i, loan.term, loan.platform))
            break
          case 2: // 第一期等额本息的利息做为后面每期的奖励，如365易贷的特权加息
            platformRewardInterest = new Decimal(platformRewardInterest).plus(calcInterest(loan.principal, loan.channelReward.interestRateIncrease, 1, loan.term, loan.platform))
            break
          case 3: // 等额本息固定利息，如广信贷
            platformRewardInterest = new Decimal(platformRewardInterest).plus(calcRewardInterest(loan.principal, loan.interestRate, loan.platformReward.interestRateIncrease, loan.term, loan.platform))
            break
        }
      }

      let platformRewardFee = platformRound(new Decimal(platformRewardInterest).mul(loan.platformReward.interestManagementFee))
      // 渠道奖励回款计算
      let channelRewardInterest = everyChannelRedEnvelope

      if (loan.channelReward.interestRateIncrease > 0) {
        switch (loan.channelReward.interestType) {
          case 1: // 等额本息
            channelRewardInterest = new Decimal(channelRewardInterest).plus(calcInterest(loan.principal, loan.channelReward.interestRateIncrease, i, loan.term, loan.platform))
            break
          case 2: // 第一期等额本息的利息做为后面每期的奖励，如365易贷的特权加息
            channelRewardInterest = new Decimal(channelRewardInterest).plus(calcInterest(loan.principal, loan.channelReward.interestRateIncrease, 1, loan.term, loan.platform))
            break
          case 3: //  等额本息固定利息，如广信贷
            channelRewardInterest = new Decimal(channelRewardInterest).plus(calcRewardInterest(loan.principal, loan.interestRate, loan.platformReward.interestRateIncrease, loan.term, loan.platform))
            break
        }
      }
      let channelRewardFee = platformRound(new Decimal(channelRewardInterest).mul(loan.channelReward.interestManagementFee))
      // 还款小计
      let totalInterest = new Decimal(interest).plus(platformRewardInterest).plus(channelRewardInterest)
      let totalInterestManagementFee = new Decimal(interestManagementFee).plus(platformRewardFee).plus(channelRewardFee)
      let totalRepayment = new Decimal(totalInterest).plus(principal)
      let amountReceivable = new Decimal(totalRepayment).sub(totalInterestManagementFee)
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
        status: 0,
        totalInterest,
        totalInterestManagementFee,
        totalRepayment,
        amountReceivable
      }))
    }
  }
  return repayments
}

exports.getList = async (ctx, next) => {
  const results = await Loan.getList(ctx.request.query)
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
  // ctx.response.body = generateRepayment(loan)
  ctx.response.body = await loan.save().then(async function (loan) {
    let repayments = generateRepayment(loan)
    await Repayment.insertMany(repayments)
    loan.repayments = repayments
    return response(repayments)
  }).catch(function (err) {
    return response({}, [err], 500)
  })
}

exports.import = async (ctx, next) => {
  let loans = []
  ctx.request.body.forEach((item) => {
    item._id && delete item._id
    item.__v && delete item.__v
    loans.push(new Loan(item))
  })
  ctx.response.body = await Loan.insertMany(loans).then(async function (result) {
    let repayments = []
    result.forEach((loan) => {
      repayments = repayments.concat(generateRepayment(loan))
    })
    await Repayment.insertMany(repayments)
    return response()
  }).catch(function (err) {
    return response({}, [err], 500)
  })
}
