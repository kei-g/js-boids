<canvas id="boids" width="1280" height="720"></canvas>
<script src="/js-boids/boids.js" type="text/javascript">
// <!--
const b = generateBoids({ id: "boids", num: 128 })
setInterval(() => b.update(b.boids), 25)
// -->
</script>
