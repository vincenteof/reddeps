import React from 'react'

interface Sub1Props {
  text: string
}

function Sub1(props: Sub1Props) {
  return <div>{props.text}</div>
}

export default Sub1
