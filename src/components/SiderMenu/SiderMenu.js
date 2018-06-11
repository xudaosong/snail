import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Layout, Menu } from 'antd'
import styles from './index.less'
import { Link } from 'dva/router'

const { Sider } = Layout

export default class SiderMenu extends PureComponent {
  static propTypes = {
    location: PropTypes.object,
    logo: PropTypes.string,
    collapsed: PropTypes.bool,
    onCollapse: PropTypes.func
  }
  render() {
    const { logo, collapsed, onCollapse } = this.props
    const { location: { pathname } } = this.props
    return (
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint='lg'
        onCollapse={onCollapse}
        width={144}
        className={styles.sider}
      >
        <div className={styles.logo} key='logo'>
          <Link to='/'>
            <img src={logo} alt='logo' />
            <h1>Snail</h1>
          </Link>
        </div>
        <Menu
          key='Menu'
          theme='dark'
          mode='inline'
          selectedKeys={[pathname]}
        >
          <Menu.Item key='/loan/add'>
            <Link to='/loan/add'>
              <span>记一笔</span>
            </Link>
          </Menu.Item>
          <Menu.Item key='/loan'>
            <Link to='/loan'>
              <span>我的出借</span>
            </Link>
          </Menu.Item>
          <Menu.Item key='/statis/repayment'>
            <Link to='/statis/repayment'>
              <span>回款统计</span>
            </Link>
          </Menu.Item>
          <Menu.Item key='/funds/receipt'>
            <Link to='/funds/receipt'>
              <span>我要收款</span>
            </Link>
          </Menu.Item>
        </Menu>
      </Sider>
    )
  }
}
