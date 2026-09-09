/**
 * 计算辅助线及吸附位置
 * @param {Object} change - 当前拖动节点的位置变化
 * @param {Array} nodes - 所有节点
 * @param {Number} distance - 触发吸附的最大距离，默认 5
 * @returns {Object} { horizontal?, vertical?, snapPosition: {x?,y?} }
 */
export default function getHelperLines(change, nodes, distance = 12) {
  const defaultResult = {
    horizontal: undefined,
    vertical: undefined,
    snapPosition: { x: undefined, y: undefined },
  }
  const getNodeSize = node => {
    const dimensions = node?.dimensions || node?.computedPosition?.dimensions || {}
    return {
      width: Number.parseFloat(node?.style?.width) || dimensions.width || node?.width || 100,
      height: Number.parseFloat(node?.style?.height) || dimensions.height || node?.height || 40,
    }
  }

  const nodeA = nodes.find(node => node.id === change.id)
  if (!nodeA || !change.position) {
    return defaultResult
  }
  const nodeASize = getNodeSize(nodeA)

  const nodeABounds = {
    left: change.position.x,
    right: change.position.x + nodeASize.width,
    top: change.position.y,
    bottom: change.position.y + nodeASize.height,
    width: nodeASize.width,
    height: nodeASize.height,
  }
  const parentNode = nodeA.parentNode ? nodes.find(node => node.id === nodeA.parentNode) : undefined
  const helperLineOffset = {
    x: parentNode?.position?.x ?? 0,
    y: parentNode?.position?.y ?? 0,
  }

  let horizontalDistance = distance
  let verticalDistance = distance

  return nodes
    .filter(node => {
      if (node.id === nodeA.id) {
        return false
      }
      if (!nodeA.parentNode) {
        return true
      }
      return node.id === nodeA.parentNode || node.parentNode === nodeA.parentNode
    })
    .reduce((result, nodeB) => {
      const isParentNode = nodeB.id === nodeA.parentNode
      const nodeBPosition = isParentNode ? { x: 0, y: 0 } : nodeB?.position
      const nodeBSize = getNodeSize(nodeB)
      const nodeBBounds = {
        left: nodeBPosition?.x,
        right: nodeBPosition?.x + nodeBSize.width,
        top: nodeBPosition?.y,
        bottom: nodeBPosition?.y + nodeBSize.height,
        width: nodeBSize.width,
        height: nodeBSize.height,
      }
      if (![nodeBBounds.left, nodeBBounds.right, nodeBBounds.top, nodeBBounds.bottom].every(Number.isFinite)) {
        return result
      }

      // ----- 垂直方向（x 轴） -----
      const distanceLeftLeft = Math.abs(nodeABounds.left - nodeBBounds.left)
      const distanceRightRight = Math.abs(nodeABounds.right - nodeBBounds.right)
      const distanceLeftRight = Math.abs(nodeABounds.left - nodeBBounds.right)
      const distanceRightLeft = Math.abs(nodeABounds.right - nodeBBounds.left)

      if (distanceLeftLeft < verticalDistance) {
        result.snapPosition.x = nodeBBounds.left
        result.vertical = nodeBBounds.left + helperLineOffset.x
        verticalDistance = distanceLeftLeft
      }
      if (distanceRightRight < verticalDistance) {
        result.snapPosition.x = nodeBBounds.right - nodeABounds.width
        result.vertical = nodeBBounds.right + helperLineOffset.x
        verticalDistance = distanceRightRight
      }
      if (distanceLeftRight < verticalDistance) {
        result.snapPosition.x = nodeBBounds.right
        result.vertical = nodeBBounds.right + helperLineOffset.x
        verticalDistance = distanceLeftRight
      }
      if (distanceRightLeft < verticalDistance) {
        result.snapPosition.x = nodeBBounds.left - nodeABounds.width
        result.vertical = nodeBBounds.left + helperLineOffset.x
        verticalDistance = distanceRightLeft
      }

      // ----- 水平方向（y 轴） -----
      const distanceTopTop = Math.abs(nodeABounds.top - nodeBBounds.top)
      const distanceBottomTop = Math.abs(nodeABounds.bottom - nodeBBounds.top)
      const distanceBottomBottom = Math.abs(nodeABounds.bottom - nodeBBounds.bottom)
      const distanceTopBottom = Math.abs(nodeABounds.top - nodeBBounds.bottom)

      if (distanceTopTop < horizontalDistance) {
        result.snapPosition.y = nodeBBounds.top
        result.horizontal = nodeBBounds.top + helperLineOffset.y
        horizontalDistance = distanceTopTop
      }
      if (distanceBottomTop < horizontalDistance) {
        result.snapPosition.y = nodeBBounds.top - nodeABounds.height
        result.horizontal = nodeBBounds.top + helperLineOffset.y
        horizontalDistance = distanceBottomTop
      }
      if (distanceBottomBottom < horizontalDistance) {
        result.snapPosition.y = nodeBBounds.bottom - nodeABounds.height
        result.horizontal = nodeBBounds.bottom + helperLineOffset.y
        horizontalDistance = distanceBottomBottom
      }
      if (distanceTopBottom < horizontalDistance) {
        result.snapPosition.y = nodeBBounds.bottom
        result.horizontal = nodeBBounds.bottom + helperLineOffset.y
        horizontalDistance = distanceTopBottom
      }

      return result
    }, defaultResult)
}
