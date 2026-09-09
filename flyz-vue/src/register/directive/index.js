import draggableWh from '@/register/directive/draggable-wh.js'
import draggable from '@/register/directive/draggable.js'
import waterMarker from '@/register/directive/waterMarker.js'
import debounce from '@/register/directive/debounce.js'
import throttle from '@/register/directive/throttle.js'
import copy from '@/register/directive/copy.js'

export default {
  install(app) {
    app.directive('draggable-wh', draggableWh)
    app.directive('draggable', draggable)
    app.directive('water-marker', waterMarker)
    app.directive('debounce', debounce)
    app.directive('throttle', throttle)
    app.directive('copy', copy)
  },
}
