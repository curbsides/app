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
      const animationDuration = 2000,
        pauseDuration = 1000,
        totalDuration = animationDuration + pauseDuration,
        currentTime = performance.now() % totalDuration

      // Only animate during animation duration
      const t = currentTime < animationDuration ? currentTime / animationDuration : 1

      const radius = (size / 2) * 0.2
      const outerRadius = (size / 2) * 0.7 * t + radius
      const context = this.context

      // Outer circle
      context.clearRect(0, 0, this.width, this.height)
      context.beginPath()
      context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2)
      context.fillStyle = `rgba(65, 105, 225, ${1 - t})`
      context.fill()

      // Inner circle
      context.beginPath()
      context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2)
      context.fillStyle = "rgba(65, 105, 225, 1)"
      context.strokeStyle = "white"
      context.lineWidth = 6
      context.fill()
      context.stroke()

      this.data = context.getImageData(0, 0, this.width, this.height).data

      map.triggerRepaint()
      return true
    }
  }
}
