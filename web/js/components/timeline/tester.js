import React, { Component, createRef } from 'react'
// import ReactDOM from 'react-dom'
import { FixedSizeList as List } from 'react-window'
import { decay, listen, pointer, transform, value } from 'popmotion'

// import './styles.css'

class VirtualList extends Component {
  itemCount = 1000
  itemSize = 35
  scrollOffsetInitial = 0
  listX = value(0, value => {
    if (this.list) {
      this.list.scrollTo(value)
      this.scrollOffsetInitial = value
    }
  })
  clampMovement = transform.clamp(
    0,
    this.itemCount * this.itemSize - window.innerWidth,
  )

  componentDidMount() {
    listen(document, 'mousedown').start(() => {
      pointer({ x: -this.scrollOffsetInitial })
        .pipe(
          ({ x }) => -x,
          this.clampMovement,
        )
        .start(this.listX)
    })
    listen(document, 'mouseup').start(() => {
      decay({
        from: this.listX.get(),
        velocity: this.listX.getVelocity(),
      })
        .pipe(this.clampMovement)
        .start(this.listX)
    })
  }

  handleListRef = component => {
    this.list = component
  }

  handleScroll = ({ scrollOffset, scrollUpdateWasRequested }) => {
    if (!scrollUpdateWasRequested) {
      this.scrollOffsetInitial = scrollOffset
    }
  }

  render() {
    return (
      <List
      direction="horizontal"
        ref={this.handleListRef}
        onScroll={this.handleScroll}
        itemCount={this.itemCount}
        itemSize={this.itemSize}
        width={window.innerWidth}
        height={50}
      >
        {({ index, style }) => <div style={style}>{index}</div>}
      </List>
    )
  }
}

export default VirtualList;