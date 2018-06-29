import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { formatCurrency } from '../../utils/currency'
import echarts from 'echarts/lib/echarts'
import 'echarts/lib/component/legend'
import 'echarts/lib/component/title'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/chart/pie'
import _ from 'lodash'

@connect(({ statis }) => {
  const { portfolio = [] } = statis
  return {
    portfolio
  }
})
export default class PortfolioChart extends PureComponent {
  static propTypes = {
    dispatch: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    portfolio: PropTypes.arrayOf(PropTypes.object)
  }
  state = {
    echartsInstance: null
  }
  defaultOption = {
    // color: [
    //   '#FF0000',
    //   '#FFA500',
    //   '#FFFF00',
    //   '#00FF00',
    //   '#007FFF',
    //   '#0000FF',
    //   '#8B00FF'
    // ],
    title: {
      left: 'center',
      top: 'center'
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#00C2FF',
      formatter: function (params) {
        return params.name.trim() + ':<br>' + formatCurrency(params.data.value || 0)
      }
    },
    legend: {
      show: false,
      itemWidth: 8,
      itemHeight: 8,
      width: 30,
      left: 350,
      top: 'middle',
      orient: 'vertical',
      itemGap: 15,
      icon: 'circle',
      tooltip: {
        show: true
      },
      textStyle: {
        fontSize: 14,
        color: '#000000',
        width: 30,
        padding: [0, 0, 0, 3]
      }
    },
    grid: {
      // top: 0,
      // left: 0,
      // right: 0,
      // bottom: 0,
      containLabel: true
    },
    series: [{
      type: 'pie',
      hoverOffset: 5,
      center: ['50%', '50%'],
      radius: ['53%', '73%'],
      label: {
        normal: {
          show: true
        },
        emphasis: {
          show: true
        }
      }
    }]
  }
  componentDidMount() {
    const { dispatch, portfolio } = this.props
    dispatch({
      type: 'statis/getPortfolio'
    })
    this.renderChart(portfolio)
  }
  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props, nextProps)) {
      this.renderChart(nextProps.portfolio)
    }
  }
  renderChart(portfolio) {
    let { echartsInstance } = this.state
    if (!portfolio) return
    if (!echartsInstance) {
      echartsInstance = echarts.init(this.refs.chart)
      this.setState({ echartsInstance })
    }
    let principalTotal = _.sumBy(portfolio, 'principal')
    let data = _.map(_.orderBy(portfolio, ['principal'], ['desc']), (item) => {
      let percent = (item.principal / principalTotal * 100).toFixed(2)
      return {
        name: `${item.platform} ${percent}%`,
        value: item.principal
      }
    })
    let option = {
      title: {
        text: formatCurrency(principalTotal)
      },
      series: [{
        data
      }]
    }
    option = _.merge({}, this.defaultOption, option)
    echartsInstance.setOption(option)
  }
  render() {
    let {
      className,
      style
    } = this.props
    style = _.merge({}, { height: 280, width: 480 }, style)
    return (
      <div ref='chart' style={style} className={className} />
    )
  }
}
