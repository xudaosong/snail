const moment = require('moment')
const mongoose = require('mongoose')
const { response } = require('../utils/require')
const Loan = mongoose.model('Loan')
const LoanReward = mongoose.model('LoanReward')
const Repayment = mongoose.model('Repayment')

// 按等额本息计算每期应还本金
const calcPrincipal = function (principal, interestRate, currentTerm, toalTerm) {
  let monthInterest = interestRate / 12
  // 每月应还本金=贷款本金×月利率×(1+月利率)^(还款月序号-1)÷〔(1+月利率)^还款月数-1〕
  return principal * monthInterest * (1 + monthInterest) ** (currentTerm - 1) / ((1 + monthInterest) ** toalTerm - 1)
}

// 按等额本息计算每期应还利息
const calcInterest = function (principal, interestRate, currentTerm, toalTerm) {
  if (interestRate === 0) {
    return 0
  }
  let monthInterest = interestRate / 12
  // 每月应还利息=贷款本金×月利率×〔(1+月利率)^还款月数-(1+月利率)^(还款月序号-1)〕÷〔(1+月利率)^还款月数-1〕
  return principal * monthInterest * ((1 + monthInterest) ** toalTerm - (1 + monthInterest) ** (currentTerm - 1)) / ((1 + monthInterest) ** toalTerm - 1)
}

// 平台加息奖励计算，如广信贷
const calcRewardInterest = function (principal, originalInterest, bonusInterest, toalTerm) {
  // 计算方法为：每期加息金额 = (标面利息的总和-奖励加息后利息的总和)/总期数
  let originalInterestAmount = 0
  let bonusInterestAmount = 0
  // 获取标面总利息的总和
  for (let i = 1; i <= toalTerm; i++) {
    originalInterestAmount += calcInterest(principal, originalInterest, i, toalTerm)
  }
  // 获取奖励加息后利息的总和
  for (let i = 1; i <= toalTerm; i++) {
    bonusInterestAmount += calcInterest(principal, originalInterest + bonusInterest, i, toalTerm)
  }
  return (bonusInterestAmount - originalInterestAmount) / toalTerm
}

exports.getList = async (ctx, next) => {
  const results = await Loan.getList()
  ctx.response.body = response(results)
}

exports.getRepaymentList = async (ctx, next) => {
  const results = await Repayment.getList({loanId: ctx.request.query.loanId})
  ctx.response.body = response(results)
}

exports.add = async (ctx, next) => {
  let params = ctx.request.body
  params.platformReward = new LoanReward(params.platformReward)
  params.channelReward = new LoanReward(params.channelReward)
  const loan = new Loan(params)
  ctx.response.body = await loan.save().then(function (loan) {
    switch (loan.repaymentMode) {
      case 1: // 等额本息
        let repayments = []
        let platformRewardInterest = 0
        switch (loan.platform) {
          case '广信贷':
            platformRewardInterest = calcRewardInterest(loan.principal, loan.interestRate, loan.platformReward.interestRateIncrease, loan.term)
            break
        }
        for (let i = 1; i <= loan.term; i++) {
          let interest = calcInterest(loan.principal, loan.interestRate, i, loan.term)
          let principal = calcPrincipal(loan.principal, loan.interestRate, i, loan.term)
          let interestManagementFee = interest * loan.interestManagementFee
          // switch (loan.platform) {
          //   case '广信贷':
          //     platformRewardInterest = calcRewardInterest(loan.principal, loan.interestRate, loan.platformReward.interestRateIncrease, loan.term)
          //     break
          //   default:
          //     platformRewardInterest = calcInterest(loan.principal, loan.platformReward.interestRateIncrease, i, loan.term)
          //     break
          // }
          let platformRewardFee = platformRewardInterest * loan.platformReward.interestManagementFee
          let channelRewardInterest = 0
          switch (loan.channelReward.interestType) {
            case 1: // 等额本息
              channelRewardInterest = calcInterest(loan.principal, loan.channelReward.interestRateIncrease, i, loan.term)
              break
            case 2: // 365特权加息
              channelRewardInterest = calcInterest(loan.principal, loan.channelReward.interestRateIncrease, 1, loan.term)
              break
          }
          let channelRewardFee = platformRewardInterest * loan.channelReward.interestManagementFee
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
            repaymentDate: moment(loan.interestDate).add(i, 'month').format(),
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
        break
    }
    return response(loan)
  }).catch(function (err) {
    return response({}, [err], 500)
  })
}
