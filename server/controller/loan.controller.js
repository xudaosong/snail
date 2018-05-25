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

exports.getList = async (ctx, next) => {
  const results = await Loan.getList()
  ctx.response.body = response(results)
}

exports.add = async (ctx, next) => {
  let params = ctx.request.body
  params.platformReward = new LoanReward(params.platformReward)
  params.channelReward = new LoanReward(params.channelReward)
  const loan = new Loan(params)
  ctx.response.body = await loan.save().then(async function (loan) {
    switch (loan.repaymentMode) {
      case 1: // 等额本息
        let repayments = []
        for (let i = 1; i <= loan.term; i++) {
          let interest = calcInterest(loan.principal, loan.interestRate, i, loan.term)
          let principal = calcPrincipal(loan.principal, loan.interestRate, i, loan.term)
          let interestManagementFee = interest * loan.interestManagementFee
          let platformRewardInterest = calcInterest(loan.principal, loan.platformReward.interestRateIncrease, i, loan.term)
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
          let amountReceivable = totalRepayment + totalInterestManagementFee

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
        await Repayment.insertMany(repayments).then(function (result) {
          loan.repayments = repayments
        })
        break
    }
    return response(loan)
  }).catch(function (err) {
    console.log(err)
    return response({}, [err], 500)
  })
}
