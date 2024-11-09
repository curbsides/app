import mapboxgl from "mapbox-gl"

export const createPulsingDot = (map: mapboxgl.Map) => {
  const size = 200

  return {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),

    onAdd: function () {
      const canvas = document.createElement("canvas")
      canvas.width = this.width
      canvas.height = this.height
      this.context = canvas.getContext("2d")
    },

    render: function () {
      const duration = 1000
      const t = (performance.now() % duration) / duration

      const radius = (size / 2) * 0.3
      const outerRadius = (size / 2) * 0.7 * t + radius
      const context = this.context

      // Draw the outer circle
      context.clearRect(0, 0, this.width, this.height)
      context.beginPath()
      context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2)
      context.fillStyle = `rgba(255, 200, 200, ${1 - t})`
      context.fill()

      // Draw the inner circle
      context.beginPath()
      context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2)
      context.fillStyle = "rgba(255, 100, 100, 1)"
      context.strokeStyle = "white"
      context.lineWidth = 2 + 4 * (1 - t)
      context.fill()
      context.stroke()

      this.data = context.getImageData(0, 0, this.width, this.height).data

      map.triggerRepaint()
      return true
    }
  }
}
