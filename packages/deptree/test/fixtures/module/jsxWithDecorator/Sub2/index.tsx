import React from 'react'
import { calculate } from './helper'
import connect from './connect'

interface Sub2Props {
  value: number
}

@connect(
  (state) => ({
    x: state.x,
  }),
  (dispatch) => ({
    act: () => dispatch({}),
  })
)
class Sub2 extends React.Component<Sub2Props> {
  render() {
    return <div>{calculate(this.props.value)}</div>
  }
}

export default Sub2
