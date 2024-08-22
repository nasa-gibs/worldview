class Snowflake {
  constructor(x, y, radius, speed) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = speed;
  }

  update() {
    this.y += this.speed;
    this.x += Math.random() * 0.25 - 0.125;
  }

  render(context) {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fillStyle = 'white';
    context.fill();
  }
}

function draw(context, snowflakes) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  snowflakes.forEach((snowflake) => {
    snowflake.update();
    snowflake.render(context);
  });
}

onmessage = function(event) {
  const { data } = event;
  const { canvas } = data;
  const context = canvas.getContext('2d');

  const snowflakes = [];

  function render(time) {
    for (let i = 0; i < 3; i += 1) {
      const x = Math.random() * (canvas.width * 2) - (canvas.width / 2);
      const y = 0;
      const radius = Math.random() * 1.5;
      const speed = Math.random() * 0.25 + 0.25;
      snowflakes.push(new Snowflake(x, y, radius, speed));
    }

    const drawnSnowflakes = snowflakes.filter((snowflake) => snowflake.y < canvas.height);

    draw(context, drawnSnowflakes);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
};
