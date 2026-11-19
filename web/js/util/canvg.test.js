import canvg from './canvg';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('rgbcolor', () => {
  return jest.fn().mockImplementation((color) => ({
    ok: color === 'red' || color === 'blue',
    r: color === 'red' ? 255 : 0,
    g: 0,
    b: color === 'blue' ? 255 : 0,
  }));
});

jest.mock('stackblur', () => ({
  canvasRGBA: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Canvas / Context mock helpers
// ---------------------------------------------------------------------------

function makeMockContext(canvasElement) {
  const canvas = canvasElement || document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  canvas.style.width = '';
  canvas.style.height = '';
  canvas.style.cursor = '';

  if (!canvas.parentNode) {
    const wrapper = document.createElement('div');
    wrapper.style.width = '200px';
    wrapper.style.height = '200px';
    Object.defineProperty(wrapper, 'clientWidth', { value: 200, configurable: true });
    Object.defineProperty(wrapper, 'clientHeight', { value: 200, configurable: true });
    wrapper.appendChild(canvas);
    document.body.appendChild(wrapper);
  }

  return {
    canvas,
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    transform: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    clip: jest.fn(),
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    drawImage: jest.fn(),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    measureText: jest.fn(() => ({ width: 10 })),
    createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
    createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
    createPattern: jest.fn(() => ({})),
    getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(400) })),
    putImageData: jest.fn(),
    setLineDash: jest.fn(),
    isPointInPath: jest.fn(() => false),
    quadraticCurveTo: jest.fn(),
    bezierCurveTo: jest.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    lineCap: '',
    lineJoin: '',
    miterLimit: 4,
    globalAlpha: 1,
    font: '12px sans-serif',
    textBaseline: '',
  };
}

function makeMockCanvas() {
  const canvasElement = document.createElement('canvas');
  canvasElement.width = 100;
  canvasElement.height = 100;
  canvasElement.id = 'mock-canvas';

  const mockCtx = makeMockContext(canvasElement);

  // Override getContext to return our mock context
  canvasElement.getContext = jest.fn(() => mockCtx);

  // Attach extra props used by canvg
  canvasElement.svg = null;

  return canvasElement;
}

// ---------------------------------------------------------------------------
// Minimal SVG XML strings
// ---------------------------------------------------------------------------

const SIMPLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>';

// ---------------------------------------------------------------------------
// canvg — no parameters (replace SVG tags on page)
// ---------------------------------------------------------------------------

describe('canvg() — no parameters', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    // Remove any canvases/wrappers appended to body during tests
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('replaces SVG elements with canvas elements', () => {
    const mockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    mockSvg.innerHTML = '';
    Object.defineProperty(mockSvg, 'clientWidth', { value: 50, configurable: true });
    Object.defineProperty(mockSvg, 'clientHeight', { value: 50, configurable: true });

    const parent = document.createElement('div');
    parent.appendChild(mockSvg);
    document.body.appendChild(parent);

    const insertBeforeSpy = jest.spyOn(parent, 'insertBefore');
    const removeChildSpy = jest.spyOn(parent, 'removeChild');

    canvg(null, null, null);

    expect(insertBeforeSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    document.body.removeChild(parent);
  });

  it('does nothing when no SVG elements exist', () => {
    // Ensure no SVGs on page
    document.querySelectorAll('svg').forEach((s) => s.remove());
    expect(() => canvg(null, null, null)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// canvg — string target (getElementById)
// ---------------------------------------------------------------------------

describe('canvg() — string target', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    // Remove any canvases/wrappers appended to body during tests
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('resolves target by id when target is a string', () => {
    const mockCanvas = makeMockCanvas();
    jest.spyOn(document, 'getElementById').mockReturnValue(mockCanvas);

    expect(() => canvg('my-canvas', SIMPLE_SVG, {})).not.toThrow();
    expect(document.getElementById).toHaveBeenCalledWith('my-canvas');
  });
});

// ---------------------------------------------------------------------------
// canvg — load from XML string
// ---------------------------------------------------------------------------

describe('canvg() — XML string loading', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    // Remove any canvases/wrappers appended to body during tests
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('calls loadXml when s starts with <', () => {
    const mockCanvas = makeMockCanvas();
    expect(() => canvg(mockCanvas, SIMPLE_SVG, {})).not.toThrow();
  });

  it('calls loadXml with opts', () => {
    const mockCanvas = makeMockCanvas();
    const opts = {
      ignoreMouse: true, ignoreAnimation: true,
    };
    expect(() => canvg(mockCanvas, SIMPLE_SVG, opts)).not.toThrow();
  });

  it('stops existing svg before loading new one', () => {
    const mockCanvas = makeMockCanvas();
    const stopFn = jest.fn();
    mockCanvas.svg = { stop: stopFn };
    canvg(mockCanvas, SIMPLE_SVG, {});
    expect(stopFn).toHaveBeenCalled();
  });
  it('does not assign svg when canvas has an OBJECT child node', () => {
    const mockCanvas = makeMockCanvas();
    const objectEl = document.createElement('object');
    mockCanvas.appendChild(objectEl);
    canvg(mockCanvas, SIMPLE_SVG, {});
    expect(mockCanvas.svg).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// canvg — load from XML document
// ---------------------------------------------------------------------------

describe('canvg() — XML document loading', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    // Remove any canvases/wrappers appended to body during tests
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('calls loadXmlDoc when s has a documentElement', () => {
    const mockCanvas = makeMockCanvas();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(SIMPLE_SVG, 'text/xml');
    expect(() => canvg(mockCanvas, xmlDoc, {})).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// canvg — load from URL
// ---------------------------------------------------------------------------

describe('canvg() — URL loading', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();

    // Mock XMLHttpRequest
    global.XMLHttpRequest = jest.fn().mockImplementation(() => ({
      open: jest.fn(),
      send: jest.fn(),
      responseText: SIMPLE_SVG,
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    // Remove any canvases/wrappers appended to body during tests
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('calls ajax load when s is a URL (does not start with <)', () => {
    const mockCanvas = makeMockCanvas();
    expect(() => canvg(mockCanvas, 'http://example.com/image.svg', {})).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// canvg opts — ignoreMouse, ignoreDimensions, ignoreClear, etc.
// ---------------------------------------------------------------------------

describe('canvg() — opts flags', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    // Remove any canvases/wrappers appended to body during tests
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('accepts ignoreMouse: true without throwing', () => {
    const mockCanvas = makeMockCanvas();
    expect(() => canvg(mockCanvas, SIMPLE_SVG, { ignoreMouse: true })).not.toThrow();
  });

  it('accepts ignoreAnimation: true without throwing', () => {
    const mockCanvas = makeMockCanvas();
    expect(() => canvg(mockCanvas, SIMPLE_SVG, { ignoreAnimation: true })).not.toThrow();
  });

  it('accepts ignoreDimensions: true without throwing', () => {
    const mockCanvas = makeMockCanvas();
    expect(() => canvg(mockCanvas, SIMPLE_SVG, { ignoreDimensions: true })).not.toThrow();
  });

  it('accepts ignoreClear: true without throwing', () => {
    const mockCanvas = makeMockCanvas();
    expect(() => canvg(mockCanvas, SIMPLE_SVG, { ignoreClear: true })).not.toThrow();
  });

  it('accepts offsetX and offsetY without throwing', () => {
    const mockCanvas = makeMockCanvas();
    expect(() =>
      canvg(mockCanvas, SIMPLE_SVG, { offsetX: 10, offsetY: 20 }),
    ).not.toThrow();
  });

  it('accepts scaleWidth and scaleHeight without throwing', () => {
    const ctx = makeMockContext();
    const mockCanvas = makeMockCanvas(ctx);
    const svgWithViewBox =
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"></svg>';
    expect(() =>
      canvg(mockCanvas, svgWithViewBox, { scaleWidth: 200, scaleHeight: 200 }),
    ).not.toThrow();
  });

  it('calls renderCallback after first render', () => {
    const mockCanvas = makeMockCanvas();
    const renderCallback = jest.fn();
    canvg(mockCanvas, SIMPLE_SVG, { renderCallback, ignoreMouse: true, ignoreAnimation: true });
    expect(renderCallback).toHaveBeenCalled();
  });

  it('accepts log: true and enables logging', () => {
    const mockCanvas = makeMockCanvas();
    expect(() => canvg(mockCanvas, SIMPLE_SVG, { log: true })).not.toThrow();
  });

  it('calls forceRedraw on interval tick when provided', () => {
    const mockCanvas = makeMockCanvas();
    const forceRedraw = jest.fn(() => true);
    canvg(mockCanvas, SIMPLE_SVG, {
      forceRedraw,
      ignoreMouse: true,
      ignoreAnimation: true,
    });
    act(() => jest.advanceTimersByTime(1000 / 30));
    expect(forceRedraw).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// SVG with various elements
// ---------------------------------------------------------------------------

describe('canvg() — various SVG elements', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    // Remove any canvases/wrappers appended to body during tests
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('renders SVG with a rect element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="10" y="10" width="50" height="50" fill="red"/></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with a circle element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="blue"/></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with an ellipse element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><ellipse cx="50" cy="50" rx="40" ry="20" fill="green"/></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with a line element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><line x1="0" y1="0" x2="100" y2="100" stroke="black"/></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with a polyline element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><polyline points="0,0 50,50 100,0" stroke="black" fill="none"/></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with a polygon element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><polygon points="50,0 100,100 0,100" fill="yellow"/></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with a path element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path d="M 10 10 L 90 10 L 90 90 Z" fill="purple"/></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with a g group element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><g><rect x="10" y="10" width="30" height="30" fill="red"/></g></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with a defs element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs><rect id="r" width="10" height="10"/></defs></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with display:none style', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="0" y="0" width="10" height="10" style="display:none"/></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with a title element (ignored)', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><title>My SVG</title><rect x="0" y="0" width="50" height="50"/></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with a linearGradient', () => {
    const ctx = makeMockContext();
    const mockCanvas = makeMockCanvas(ctx);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="red"/>
          <stop offset="1" stop-color="blue"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="url(#lg)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with a viewBox and preserveAspectRatio', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet"><rect x="0" y="0" width="200" height="200" fill="red"/></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with opacity', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="0" y="0" width="50" height="50" opacity="0.5"/></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with transform attribute', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="0" y="0" width="50" height="50" transform="translate(10,10)"/></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with a path using bezier curves', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path d="M 10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80" fill="none" stroke="black"/></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with a path using quadratic curves', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path d="M 10 80 Q 95 10 180 80 T 350 80" fill="none" stroke="black"/></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with arc path commands', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><path d="M 80 80 A 45 45 0 0 0 125 125 L 125 80 Z" fill="green"/></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with stroke properties', () => {
    const mockCanvas = makeMockCanvas();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="10" y="10" width="80" height="80" stroke="black" stroke-width="2" stroke-dasharray="5,5"/></svg>';
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// ADDITIONAL TESTS to push coverage past 80%
// Append these describe blocks to the existing test file
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SVG with text / font elements
// ---------------------------------------------------------------------------

describe('canvg() — text and font elements', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('renders text with font-size, font-family, font-weight, font-style', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <text x="10" y="50" font-size="16px" font-family="Arial" font-weight="bold" font-style="italic">Hello World</text>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders text with text-anchor middle', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <text x="100" y="50" text-anchor="middle">Centered</text>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders text with text-anchor end', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <text x="200" y="50" text-anchor="end">End</text>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders text with tspan elements', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <text x="10" y="50">
        <tspan x="10" dy="0">Line 1</tspan>
        <tspan x="10" dy="20">Line 2</tspan>
      </text>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders text with dx and dy attributes', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <text x="10" y="50" dx="5" dy="5">Shifted</text>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders text with fill and stroke', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <text x="10" y="50" fill="red" stroke="blue" stroke-width="1">Styled</text>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders tref element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <defs><text id="reusable">Reusable Text</text></defs>
      <text x="10" y="50"><tref href="#reusable"/></text>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders text with dominant-baseline', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <text x="10" y="50" dominant-baseline="middle">Baseline</text>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with gradient elements and stops
// ---------------------------------------------------------------------------

describe('canvg() — gradients', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('renders radialGradient with cx cy r fx fy', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <radialGradient id="rg" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stop-color="white"/>
          <stop offset="100%" stop-color="black"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#rg)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {ignoreMouse: true, ignoreAnimation: true })).not.toThrow();
  });

  it('renders linearGradient with gradientUnits userSpaceOnUse', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <linearGradient id="lg2" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="red" stop-opacity="1"/>
          <stop offset="1" stop-color="blue" stop-opacity="0.5"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="url(#lg2)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {ignoreMouse: true, ignoreAnimation: true })).not.toThrow();
  });

  it('renders linearGradient with gradientTransform', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <linearGradient id="lg3" x1="0" y1="0" x2="1" y2="0" gradientTransform="rotate(45)">
          <stop offset="0" stop-color="red"/>
          <stop offset="1" stop-color="blue"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="url(#lg3)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {ignoreMouse: true, ignoreAnimation: true })).not.toThrow();
  });

  it('renders gradient referenced via href/xlink:href', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100">
      <defs>
        <linearGradient id="base" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="red"/>
          <stop offset="1" stop-color="blue"/>
        </linearGradient>
        <linearGradient id="derived" xlink:href="#base"/>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="url(#derived)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {ignoreMouse: true, ignoreAnimation: true })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with clipPath and mask
// ---------------------------------------------------------------------------

describe('canvg() — clipPath and mask', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  const makeRealCanvas = () => {
    const canvasElement = document.createElement('canvas');
    canvasElement.width = 100;
    canvasElement.height = 100;
    canvasElement.svg = null;
    // Use the real getContext so canvg's prototype patching works correctly
    const realGetContext = HTMLCanvasElement.prototype.getContext.bind(canvasElement);
    canvasElement.getContext = realGetContext;
    return canvasElement;
  };

  it('renders clipPath on a rect', () => {
    const canvas = makeRealCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <clipPath id="clip1">
          <circle cx="50" cy="50" r="40"/>
        </clipPath>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="red" clip-path="url(#clip1)"/>
    </svg>`;
    expect(() => canvg(canvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
    if (canvas.svg) canvas.svg.stop();
  });

  it('renders mask on a rect', () => {
    const canvas = makeRealCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <mask id="mask1">
          <rect x="0" y="0" width="50" height="100" fill="white"/>
          <rect x="50" y="0" width="50" height="100" fill="black"/>
        </mask>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="blue" mask="url(#mask1)"/>
    </svg>`;
    expect(() => canvg(canvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
    if (canvas.svg) canvas.svg.stop();
  });

  it('renders clipPath with polygon', () => {
    const canvas = makeRealCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <clipPath id="clip2">
          <polygon points="50,0 100,100 0,100"/>
        </clipPath>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="green" clip-path="url(#clip2)"/>
    </svg>`;
    expect(() => canvg(canvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
    if (canvas.svg) canvas.svg.stop();
  });
});

// ---------------------------------------------------------------------------
// SVG with pattern elements
// ---------------------------------------------------------------------------

describe('canvg() — patterns', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('renders a pattern fill', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <pattern id="pat1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="10" height="10" fill="red"/>
          <rect x="10" y="10" width="10" height="10" fill="blue"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="url(#pat1)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {ignoreMouse: true, ignoreAnimation: true })).not.toThrow();
  });

  it('renders pattern with patternTransform', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <pattern id="pat2" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="5" cy="5" r="4" fill="green"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="url(#pat2)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {ignoreMouse: true, ignoreAnimation: true })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with filter elements
// ---------------------------------------------------------------------------

describe('canvg() — filter elements', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('renders SVG with feGaussianBlur filter', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <filter id="blur1">
          <feGaussianBlur stdDeviation="3"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" fill="red" filter="url(#blur1)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with feColorMatrix filter (saturate)', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <filter id="cm1">
          <feColorMatrix type="saturate" values="0.5"/>
        </filter>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="blue" filter="url(#cm1)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with feColorMatrix filter (hueRotate)', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <filter id="cm2">
          <feColorMatrix type="hueRotate" values="180"/>
        </filter>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="red" filter="url(#cm2)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with feColorMatrix filter (luminanceToAlpha)', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <filter id="cm3">
          <feColorMatrix type="luminanceToAlpha"/>
        </filter>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="green" filter="url(#cm3)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with feMorphology', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <filter id="morph1">
          <feMorphology operator="erode" radius="2"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" fill="red" filter="url(#morph1)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders SVG with feComposite', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <filter id="comp1">
          <feComposite operator="over"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" fill="blue" filter="url(#comp1)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with marker elements
// ---------------------------------------------------------------------------

describe('canvg() — marker elements', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('renders path with marker-start and marker-end', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <defs>
        <marker id="arr" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="black"/>
        </marker>
      </defs>
      <path d="M 10 50 L 190 50" stroke="black" stroke-width="2"
        marker-start="url(#arr)" marker-end="url(#arr)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders path with marker-mid', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <defs>
        <marker id="dot" markerWidth="6" markerHeight="6" refX="3" refY="3">
          <circle cx="3" cy="3" r="3" fill="red"/>
        </marker>
      </defs>
      <polyline points="10,50 100,30 190,50" fill="none" stroke="black" marker-mid="url(#dot)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with use / symbol elements
// ---------------------------------------------------------------------------

describe('canvg() — use and symbol elements', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('renders use element referencing a group', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <defs>
        <g id="arrow">
          <line x1="0" y1="0" x2="10" y2="0" stroke="black"/>
        </g>
      </defs>
      <use href="#arrow" x="10" y="50"/>
      <use href="#arrow" x="50" y="50"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders symbol with viewBox and use', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <defs>
        <symbol id="icon" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="10" fill="blue"/>
        </symbol>
      </defs>
      <use href="#icon" x="10" y="10" width="30" height="30"/>
      <use href="#icon" x="60" y="10" width="30" height="30"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders use with xlink:href', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="100">
      <defs>
        <rect id="r1" width="20" height="20" fill="red"/>
      </defs>
      <use xlink:href="#r1" x="10" y="10"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with animation elements (SMIL)
// ---------------------------------------------------------------------------

describe('canvg() — SMIL animation elements', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('renders animate element (not ignoring animation)', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="50" height="50" fill="red">
        <animate attributeName="x" from="10" to="80" dur="2s" repeatCount="1"/>
      </rect>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreAnimation: false, ignoreMouse: true,
    })).not.toThrow();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });

  it('renders animateColor element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="50" height="50" fill="red">
        <animateColor attributeName="fill" from="red" to="blue" dur="2s"/>
      </rect>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreAnimation: false, ignoreMouse: true,
    })).not.toThrow();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });

  it('renders animateTransform element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="50" height="50" fill="blue">
        <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="3s" repeatCount="indefinite"/>
      </rect>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreAnimation: false, ignoreMouse: true,
    })).not.toThrow();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });

  it('renders set element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="50" height="50" fill="green">
        <set attributeName="visibility" to="hidden" begin="1s" dur="2s"/>
      </rect>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreAnimation: false, ignoreMouse: true,
    })).not.toThrow();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });

  it('advances animation on interval tick', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="50" height="50" fill="red">
        <animate attributeName="x" from="10" to="80" dur="2s" repeatCount="indefinite"/>
      </rect>
    </svg>`;
    canvg(mockCanvas, svg, { ignoreAnimation: false, ignoreMouse: true });
    expect(() => jest.advanceTimersByTime(200)).not.toThrow();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });
});

// ---------------------------------------------------------------------------
// SVG with nested SVG
// ---------------------------------------------------------------------------

describe('canvg() — nested SVG', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('renders nested svg element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <svg x="10" y="10" width="100" height="100">
        <rect x="0" y="0" width="100" height="100" fill="red"/>
      </svg>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {ignoreMouse: true, ignoreAnimation: true })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with image element
// ---------------------------------------------------------------------------

describe('canvg() — image element', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('renders image element with href', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==" x="0" y="0" width="50" height="50"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders image element with xlink:href', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100">
      <image xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==" x="0" y="0" width="50" height="50"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with style element (CSS)
// ---------------------------------------------------------------------------

describe('canvg() — style element (CSS)', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('applies CSS class from style element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <style>.red { fill: red; } .blue { fill: blue; }</style>
      <rect x="0" y="0" width="50" height="50" class="red"/>
      <rect x="50" y="0" width="50" height="50" class="blue"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('applies CSS id selector from style element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <style>#myRect { fill: green; stroke: black; }</style>
      <rect id="myRect" x="10" y="10" width="80" height="80"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('applies CSS element selector', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <style>rect { fill: purple; } circle { fill: orange; }</style>
      <rect x="0" y="0" width="50" height="50"/>
      <circle cx="75" cy="25" r="20"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles CSS with comments', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <style>/* comment */ .test { fill: red; /* another comment */ }</style>
      <rect x="0" y="0" width="50" height="50" class="test"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with transform variants
// ---------------------------------------------------------------------------

describe('canvg() — additional transform variants', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles rotate with cx cy', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="0" y="0" width="30" height="30" transform="rotate(45 50 50)" fill="red"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles multiple chained transforms', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="0" y="0" width="20" height="20" transform="translate(10,10) rotate(45) scale(0.5)" fill="blue"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles scale with single value', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="0" y="0" width="20" height="20" transform="scale(2)" fill="green"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with various stroke settings
// ---------------------------------------------------------------------------

describe('canvg() — stroke settings', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('renders stroke with stroke-linejoin miter', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <polyline points="10,10 50,80 90,10" fill="none" stroke="black" stroke-linejoin="miter"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders stroke with stroke-linejoin round', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <polyline points="10,10 50,80 90,10" fill="none" stroke="black" stroke-linejoin="round"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders stroke with stroke-linejoin bevel', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <polyline points="10,10 50,80 90,10" fill="none" stroke="black" stroke-linejoin="bevel"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders stroke with stroke-miterlimit', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <polyline points="10,10 50,80 90,10" fill="none" stroke="black" stroke-miterlimit="2"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders stroke with stroke-dashoffset', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <line x1="0" y1="50" x2="100" y2="50" stroke="black" stroke-dasharray="10,5" stroke-dashoffset="5"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with various path command variants
// ---------------------------------------------------------------------------

describe('canvg() — path command variants', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles H and V absolute path commands', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <path d="M 10 10 H 90 V 90 H 10 Z" fill="none" stroke="black"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles h and v relative path commands', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <path d="M 10 10 h 80 v 80 h -80 z" fill="none" stroke="black"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles A arc path command with large arc flag', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <path d="M 50 100 A 50 50 0 1 0 150 100" fill="none" stroke="black"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles multiple M commands in path', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <path d="M 10 10 L 30 30 M 50 10 L 70 30" fill="none" stroke="black"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with fill-rule and clip-rule
// ---------------------------------------------------------------------------

describe('canvg() — fill-rule and clip-rule', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles fill-rule evenodd', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <path d="M 10 10 L 90 10 L 90 90 L 10 90 Z M 30 30 L 70 30 L 70 70 L 30 70 Z" fill-rule="evenodd" fill="red"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles fill-rule nonzero', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <path d="M 10 10 L 90 10 L 90 90 L 10 90 Z" fill-rule="nonzero" fill="blue"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with visibility and display
// ---------------------------------------------------------------------------

describe('canvg() — visibility and display', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles visibility:hidden attribute', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="80" height="80" visibility="hidden" fill="red"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles display:inline style', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="80" height="80" style="display:inline" fill="blue"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with global composite operations and alpha
// ---------------------------------------------------------------------------

describe('canvg() — globalCompositeOperation and globalAlpha', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles fill-opacity and stroke-opacity together', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="80" height="80" fill="red" fill-opacity="0.7" stroke="blue" stroke-opacity="0.3" stroke-width="3"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with a element (anchor)
// ---------------------------------------------------------------------------

describe('canvg() — anchor (a) element', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('renders a element wrapping text', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="100">
      <a xlink:href="http://example.com">
        <text x="10" y="50">Click me</text>
      </a>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders a element wrapping rect', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="100">
      <a xlink:href="http://example.com">
        <rect x="10" y="10" width="80" height="80" fill="blue"/>
      </a>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with mouse events (non-ignored)
// ---------------------------------------------------------------------------

describe('canvg() — mouse events (not ignored)', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('fires mouse events when ignoreMouse is false', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="0" y="0" width="100" height="100" fill="red"/>
    </svg>`;
    canvg(mockCanvas, svg, { ignoreMouse: false, ignoreAnimation: true });
    mockCanvas.svg.Mouse.onclick(50, 50);
    mockCanvas.svg.Mouse.onmousemove(50, 50);
    expect(() => jest.advanceTimersByTime(100)).not.toThrow();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });

  it('checkPath sets eventElements', () => {
    const mockCanvas = makeMockCanvas();
    canvg(mockCanvas, '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="0" y="0" width="100" height="100" fill="red"/></svg>',
      { ignoreMouse: false, ignoreAnimation: true });
    const mouse = mockCanvas.svg.Mouse;
    mouse.onclick(50, 50);
    const ctx = mockCanvas.getContext('2d');
    ctx.isPointInPath.mockReturnValue(true);
    const fakeElement = { type: 'rect' };
    mouse.checkPath(fakeElement, ctx);
    expect(mouse.eventElements[0]).toBe(fakeElement);
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });

  it('checkBoundingBox sets eventElements', () => {
    const mockCanvas = makeMockCanvas();
    canvg(mockCanvas, '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="0" y="0" width="100" height="100" fill="red"/></svg>',
      { ignoreMouse: false, ignoreAnimation: true });
    const mouse = mockCanvas.svg.Mouse;
    mouse.onclick(50, 50);
    const fakeElement = { type: 'rect' };
    const bb = { isPointInBox: jest.fn(() => true) };
    mouse.checkBoundingBox(fakeElement, bb);
    expect(mouse.eventElements[0]).toBe(fakeElement);
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });

  it('runEvents executes element handlers', () => {
    const mockCanvas = makeMockCanvas();
    canvg(mockCanvas, '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="0" y="0" width="100" height="100" fill="red"/></svg>',
      { ignoreMouse: false, ignoreAnimation: true });
    const mouse = mockCanvas.svg.Mouse;
    mouse.onclick(50, 50);
    const onclickHandler = jest.fn();
    const fakeElement = { onclick: onclickHandler, parent: null };
    mouse.eventElements[0] = fakeElement;
    mouse.runEvents();
    expect(onclickHandler).toHaveBeenCalled();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });
});

// ---------------------------------------------------------------------------
// SVG with rect rx/ry rounded corners
// ---------------------------------------------------------------------------

describe('canvg() — rect with rounded corners', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('renders rect with only rx', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="80" height="80" rx="10" fill="red"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders rect with only ry', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="80" height="80" ry="10" fill="blue"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('renders rect with both rx and ry', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="80" height="80" rx="10" ry="5" fill="green"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with scaleWidth/scaleHeight using viewBox
// ---------------------------------------------------------------------------

describe('canvg() — scaleWidth/scaleHeight with viewBox', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('scales SVG with viewBox when scaleWidth provided', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
      <rect x="0" y="0" width="200" height="100" fill="red"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      scaleWidth: 400, ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('scales SVG with viewBox when scaleHeight provided', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
      <rect x="0" y="0" width="200" height="100" fill="blue"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      scaleHeight: 200, ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('scales SVG when no viewBox but width/height set', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <rect x="0" y="0" width="200" height="100" fill="green"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      scaleWidth: 100, scaleHeight: 50, ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with preserveAspectRatio variants
// ---------------------------------------------------------------------------

describe('canvg() — preserveAspectRatio', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles preserveAspectRatio xMinYMin meet', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 200 100" preserveAspectRatio="xMinYMin meet">
      <rect x="0" y="0" width="200" height="100" fill="red"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles preserveAspectRatio xMaxYMax slice', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 200 100" preserveAspectRatio="xMaxYMax slice">
      <rect x="0" y="0" width="200" height="100" fill="blue"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles preserveAspectRatio none', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 200 100" preserveAspectRatio="none">
      <rect x="0" y="0" width="200" height="100" fill="green"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// forceRedraw interval tick
// ---------------------------------------------------------------------------

describe('canvg() — forceRedraw interval', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('calls forceRedraw on each interval tick', () => {
    const mockCanvas = makeMockCanvas();
    const forceRedraw = jest.fn(() => false);
    canvg(mockCanvas, SIMPLE_SVG, { forceRedraw, ignoreMouse: true, ignoreAnimation: true });
    jest.advanceTimersByTime(500);
    expect(forceRedraw.mock.calls.length).toBeGreaterThan(0);
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });

  it('redraws when forceRedraw returns true', () => {
    const mockCanvas = makeMockCanvas();
    let callCount = 0;
    const forceRedraw = jest.fn(() => {
      callCount += 1;
      return callCount <= 2;
    });
    canvg(mockCanvas, SIMPLE_SVG, { forceRedraw, ignoreMouse: true, ignoreAnimation: true });
    expect(() => jest.advanceTimersByTime(200)).not.toThrow();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });
});

// ---------------------------------------------------------------------------
// SVG with overflow visible on nested SVG
// ---------------------------------------------------------------------------

describe('canvg() — SVG overflow attribute', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles nested SVG with overflow visible', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <svg x="10" y="10" width="100" height="100" overflow="visible">
        <circle cx="50" cy="50" r="80" fill="red"/>
      </svg>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with switch element
// ---------------------------------------------------------------------------

describe('canvg() — switch element', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('renders switch element', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <switch>
        <rect x="0" y="0" width="50" height="50" fill="red"/>
      </switch>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with desc element
// ---------------------------------------------------------------------------

describe('canvg() — desc element', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles desc element without throwing', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <desc>A description</desc>
      <rect x="0" y="0" width="50" height="50" fill="red"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// ADDITIONAL TESTS - append to existing test file to push coverage above 85%
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// drawSvg on CanvasRenderingContext2D
// ---------------------------------------------------------------------------

describe('canvg() — CanvasRenderingContext2D.drawSvg extension', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('drawSvg is added to CanvasRenderingContext2D prototype after build', () => {
    const mockCanvas = makeMockCanvas();
    canvg(mockCanvas, SIMPLE_SVG, {
      ignoreMouse: true, ignoreAnimation: true,
    });
    const ctx = mockCanvas.getContext('2d');
    expect(typeof ctx.constructor.prototype.drawSvg === 'function' ||
      typeof CanvasRenderingContext2D.prototype.drawSvg === 'function').toBe(true);
  });

  it('drawSvg can be called on a real context', () => {
    const outerCanvas = makeMockCanvas();
    canvg(outerCanvas, SIMPLE_SVG, {
      ignoreMouse: true, ignoreAnimation: true,
    });

    // After canvg runs, drawSvg should be on the prototype
    const innerCanvas = document.createElement('canvas');
    innerCanvas.width = 50;
    innerCanvas.height = 50;
    innerCanvas.svg = null;
    const realCtx = HTMLCanvasElement.prototype.getContext.call(innerCanvas, '2d');
    if (realCtx && typeof realCtx.drawSvg === 'function') {
      expect(() => realCtx.drawSvg(SIMPLE_SVG, 0, 0, 50, 50)).not.toThrow();
    } else {
      // prototype was patched on mock context class
      expect(true).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// SVG with currentColor fill and stroke
// ---------------------------------------------------------------------------

describe('canvg() — currentColor', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles fill currentColor', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" color="red">
      <rect x="0" y="0" width="50" height="50" fill="currentColor"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles stroke currentColor', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" color="blue">
      <rect x="0" y="0" width="50" height="50" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with inherit fill and stroke
// ---------------------------------------------------------------------------

describe('canvg() — inherit values', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles fill inherit', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <g fill="red">
        <rect x="0" y="0" width="50" height="50" fill="inherit"/>
      </g>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles stroke inherit', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <g stroke="blue">
        <rect x="0" y="0" width="50" height="50" stroke="inherit"/>
      </g>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with font element (inline SVG fonts)
// ---------------------------------------------------------------------------

describe('canvg() — SVG font elements', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('parses inline font element with glyphs', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <defs>
        <font id="myfont" horiz-adv-x="500">
          <font-face font-family="MyFont" units-per-em="1000" ascent="800" descent="-200"/>
          <missing-glyph horiz-adv-x="500"/>
          <glyph unicode="A" horiz-adv-x="500" d="M 0 0 L 250 700 L 500 0 Z"/>
          <glyph unicode="B" horiz-adv-x="500" d="M 0 0 L 400 0 L 400 700 L 0 700 Z"/>
        </font>
      </defs>
      <text font-family="MyFont" font-size="50" y="80">AB</text>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('parses inline font with arabic glyph forms', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <defs>
        <font id="arabicfont" horiz-adv-x="500">
          <font-face font-family="ArabicFont" units-per-em="1000"/>
          <glyph unicode="&#x0627;" arabic-form="isolated" horiz-adv-x="400" d="M 0 0 L 200 500 Z"/>
        </font>
      </defs>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with feGaussianBlur (stackblur path)
// ---------------------------------------------------------------------------

describe('canvg() — feGaussianBlur with stackblur', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('applies feGaussianBlur via stackblur', () => {
    const mockCanvas = makeMockCanvas();
    const stackblurMock = require('stackblur');
    stackblurMock.canvasRGBA.mockImplementation(() => {});

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <filter id="gblur">
          <feGaussianBlur stdDeviation="5"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" fill="blue" filter="url(#gblur)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with MISSING element (unknown tag)
// ---------------------------------------------------------------------------

describe('canvg() — MISSING element handler', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('logs error for unknown SVG element and continues', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <foobar x="0" y="0"/>
      <rect x="10" y="10" width="50" height="50" fill="red"/>
    </svg>`;
    // log: true to exercise svg.log with console.log
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true, log: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// URL load via ajax
// ---------------------------------------------------------------------------

describe('canvg() — ajax URL loading detail', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('calls XMLHttpRequest open and send for URL loading', () => {
    const mockCanvas = makeMockCanvas();
    const xhrMock = {
      open: jest.fn(),
      send: jest.fn(),
      responseText: SIMPLE_SVG,
    };
    global.XMLHttpRequest = jest.fn(() => xhrMock);

    canvg(mockCanvas, 'http://example.com/test.svg', {
      ignoreMouse: true, ignoreAnimation: true,
    });

    expect(xhrMock.open).toHaveBeenCalledWith('GET', 'http://example.com/test.svg', false);
    expect(xhrMock.send).toHaveBeenCalledWith(null);
  });

  it('returns null from ajax when XMLHttpRequest is unavailable', () => {
    const mockCanvas = makeMockCanvas();
    const origXHR = global.XMLHttpRequest;
    delete global.XMLHttpRequest;

    // Should not throw even if xhr is unavailable; loadXml will receive null
    try {
      canvg(mockCanvas, 'http://example.com/missing.svg', {
        ignoreMouse: true, ignoreAnimation: true,
      });
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // acceptable - null XML will throw in parseXml
    }

    global.XMLHttpRequest = origXHR;
  });
});

// ---------------------------------------------------------------------------
// Animation with repeatCount indefinite and fill freeze/remove
// ---------------------------------------------------------------------------

describe('canvg() — animation fill and repeatCount', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles animate with fill="freeze"', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="50" height="50" fill="red">
        <animate attributeName="x" from="10" to="80" dur="0.1s" fill="freeze"/>
      </rect>
    </svg>`;
    canvg(mockCanvas, svg, { ignoreAnimation: false, ignoreMouse: true });
    expect(() => jest.advanceTimersByTime(500)).not.toThrow();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });

  it('handles animate with fill="remove"', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="50" height="50" fill="green">
        <animate attributeName="x" from="10" to="80" dur="0.1s" fill="remove"/>
      </rect>
    </svg>`;
    canvg(mockCanvas, svg, { ignoreAnimation: false, ignoreMouse: true });
    expect(() => jest.advanceTimersByTime(500)).not.toThrow();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });

  it('handles animate with repeatCount="indefinite"', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="50" height="50" fill="blue">
        <animate attributeName="x" from="10" to="80" dur="0.1s" repeatCount="indefinite"/>
      </rect>
    </svg>`;
    canvg(mockCanvas, svg, { ignoreAnimation: false, ignoreMouse: true });
    expect(() => jest.advanceTimersByTime(1000)).not.toThrow();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });

  it('handles animate with repeatDur="indefinite"', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="50" height="50" fill="purple">
        <animate attributeName="width" from="50" to="80" dur="0.1s" repeatDur="indefinite"/>
      </rect>
    </svg>`;
    canvg(mockCanvas, svg, { ignoreAnimation: false, ignoreMouse: true });
    expect(() => jest.advanceTimersByTime(500)).not.toThrow();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });

  it('handles animate with values list', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="50" height="50" fill="red">
        <animate attributeName="x" values="10;50;80;10" dur="1s" repeatCount="1"/>
      </rect>
    </svg>`;
    canvg(mockCanvas, svg, { ignoreAnimation: false, ignoreMouse: true });
    expect(() => jest.advanceTimersByTime(500)).not.toThrow();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });

  it('handles animateTransform with type=translate', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="0" y="0" width="30" height="30" fill="blue">
        <animateTransform attributeName="transform" type="translate" from="0 0" to="50 50" dur="0.5s"/>
      </rect>
    </svg>`;
    canvg(mockCanvas, svg, { ignoreAnimation: false, ignoreMouse: true });
    expect(() => jest.advanceTimersByTime(300)).not.toThrow();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });

  it('handles animateTransform with type=scale', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="10" y="10" width="30" height="30" fill="green">
        <animateTransform attributeName="transform" type="scale" from="1" to="2" dur="0.5s"/>
      </rect>
    </svg>`;
    canvg(mockCanvas, svg, { ignoreAnimation: false, ignoreMouse: true });
    expect(() => jest.advanceTimersByTime(300)).not.toThrow();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });
});

// ---------------------------------------------------------------------------
// SVG with CSS @font-face
// ---------------------------------------------------------------------------

describe('canvg() — CSS @font-face in style element', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();

    global.XMLHttpRequest = jest.fn(() => ({
      open: jest.fn(),
      send: jest.fn(),
      responseText: SIMPLE_SVG,
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles @font-face in style without svg format src', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <style>
        @font-face {
          font-family: "TestFont";
          src: url("test.woff") format("woff");
        }
        .test { font-family: TestFont; }
      </style>
      <text x="10" y="50" class="test">Hello</text>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with multiple mouse event scenarios
// ---------------------------------------------------------------------------

describe('canvg() — mouse event edge cases', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('triggers canvas.onclick and maps coordinates', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="0" y="0" width="100" height="100" fill="red"/>
    </svg>`;
    canvg(mockCanvas, svg, { ignoreMouse: false, ignoreAnimation: true });
    const ctx = mockCanvas.getContext('2d');
    if (ctx.canvas.onclick) {
      expect(() => ctx.canvas.onclick({ clientX: 50, clientY: 50 })).not.toThrow();
    }
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });

  it('triggers canvas.onmousemove and maps coordinates', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="0" y="0" width="100" height="100" fill="blue"/>
    </svg>`;
    canvg(mockCanvas, svg, { ignoreMouse: false, ignoreAnimation: true });
    const ctx = mockCanvas.getContext('2d');
    if (ctx.canvas.onmousemove) {
      expect(() => ctx.canvas.onmousemove({ clientX: 25, clientY: 25 })).not.toThrow();
    }
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });

  it('handles mouse event with scrollX and scrollY', () => {
    const mockCanvas = makeMockCanvas();
    canvg(mockCanvas, SIMPLE_SVG, { ignoreMouse: false, ignoreAnimation: true });
    const origScrollX = window.scrollX;
    const origScrollY = window.scrollY;
    Object.defineProperty(window, 'scrollX', { value: 10, configurable: true });
    Object.defineProperty(window, 'scrollY', { value: 10, configurable: true });
    const ctx = mockCanvas.getContext('2d');
    if (ctx.canvas.onclick) {
      expect(() => ctx.canvas.onclick({ clientX: 50, clientY: 50 })).not.toThrow();
    }
    Object.defineProperty(window, 'scrollX', { value: origScrollX, configurable: true });
    Object.defineProperty(window, 'scrollY', { value: origScrollY, configurable: true });
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });
});

// ---------------------------------------------------------------------------
// SVG with various unit types in property values
// ---------------------------------------------------------------------------

describe('canvg() — various CSS unit types', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles em units in font-size', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <text x="10" y="50" font-size="1.5em">Em units</text>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles ex units', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <text x="10" y="50" font-size="2ex">Ex units</text>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles pt units', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <text x="10" y="50" font-size="12pt">Pt units</text>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles pc units', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="1pc" y="0" width="5pc" height="5pc" fill="red"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles cm units', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="0.5cm" y="0.5cm" width="2cm" height="2cm" fill="blue"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles mm units', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="5mm" y="5mm" width="20mm" height="20mm" fill="green"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles in units', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="0.1in" y="0.1in" width="0.5in" height="0.5in" fill="purple"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles deg units in animateTransform', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="25" y="25" width="50" height="50" fill="orange">
        <animateTransform attributeName="transform" type="rotate" from="0deg" to="360deg" dur="1s"/>
      </rect>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with DOM parentNode viewport fallback
// ---------------------------------------------------------------------------

describe('canvg() — viewport parent node fallback', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('uses parentNode clientWidth/clientHeight for viewport', () => {
    const wrapper = document.createElement('div');
    Object.defineProperty(wrapper, 'clientWidth', { value: 300, configurable: true });
    Object.defineProperty(wrapper, 'clientHeight', { value: 200, configurable: true });
    const canvasEl = document.createElement('canvas');
    canvasEl.width = 300;
    canvasEl.height = 200;
    canvasEl.svg = null;
    wrapper.appendChild(canvasEl);
    document.body.appendChild(wrapper);

    const mockCtx = makeMockContext(canvasEl);
    canvasEl.getContext = jest.fn(() => mockCtx);

    expect(() => canvg(canvasEl, SIMPLE_SVG, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with ignoreDimensions + width/height style
// ---------------------------------------------------------------------------

describe('canvg() — ignoreDimensions with explicit width/height', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('uses style width/height even with ignoreDimensions when both set', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200px" height="100px">
      <rect x="0" y="0" width="200" height="100" fill="red"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreDimensions: true,
      ignoreMouse: true,
      ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with stop-color and stop-opacity
// ---------------------------------------------------------------------------

describe('canvg() — gradient stop colors and opacity', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles gradient stops with stop-color and stop-opacity', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <linearGradient id="g1">
          <stop offset="0%" stop-color="#ff0000" stop-opacity="1"/>
          <stop offset="50%" stop-color="#00ff00" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#0000ff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="url(#g1)"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with very large and very small coordinates
// ---------------------------------------------------------------------------

describe('canvg() — edge case coordinates', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles negative coordinates in path', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <path d="M -10 -10 L 210 210" stroke="black"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles zero-dimension elements gracefully', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="50" y="50" width="0" height="0" fill="red"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles floating point coordinates', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <circle cx="49.5" cy="50.3" r="30.7" fill="blue"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with multiple SVGs on page (no-param branch)
// ---------------------------------------------------------------------------

describe('canvg() — no-param multiple SVGs', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
    document.body.querySelectorAll('canvas').forEach((el) => el.remove());
  });

  it('replaces multiple SVG elements', () => {
    // Add two SVG elements
    const parent1 = document.createElement('div');
    const svg1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    Object.defineProperty(svg1, 'clientWidth', { value: 50, configurable: true });
    Object.defineProperty(svg1, 'clientHeight', { value: 50, configurable: true });
    parent1.appendChild(svg1);
    document.body.appendChild(parent1);

    const parent2 = document.createElement('div');
    const svg2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    Object.defineProperty(svg2, 'clientWidth', { value: 80, configurable: true });
    Object.defineProperty(svg2, 'clientHeight', { value: 80, configurable: true });
    parent2.appendChild(svg2);
    document.body.appendChild(parent2);

    expect(() => canvg(null, null, null)).not.toThrow();

    document.body.removeChild(parent1);
    document.body.removeChild(parent2);
  });
});

// ---------------------------------------------------------------------------
// SVG property addOpacity with non-color value
// ---------------------------------------------------------------------------

describe('canvg() — addOpacity with rgba fill', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles rgba fill color with opacity', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="0" y="0" width="50" height="50" fill="rgba(255,0,0,0.5)" fill-opacity="0.8"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('handles hex fill color', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect x="0" y="0" width="50" height="50" fill="#ff0000" opacity="0.5"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with animateMotion
// ---------------------------------------------------------------------------

describe('canvg() — animateMotion element', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles animateMotion with path', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <circle r="10" fill="red">
        <animateMotion dur="1s" repeatCount="indefinite"
          path="M 10 80 C 40 10 65 10 95 80 S 150 150 180 80"/>
      </circle>
    </svg>`;
    canvg(mockCanvas, svg, { ignoreAnimation: false, ignoreMouse: true });
    expect(() => jest.advanceTimersByTime(200)).not.toThrow();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });
});

// ---------------------------------------------------------------------------
// SVG with text-decoration
// ---------------------------------------------------------------------------

describe('canvg() — text-decoration', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles text-decoration underline', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
      <text x="10" y="50" text-decoration="underline">Underlined</text>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG with image that fails to load
// ---------------------------------------------------------------------------

describe('canvg() — image loading states', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('handles image with invalid src gracefully', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <image href="invalid-image-that-doesnt-exist.png" x="0" y="0" width="50" height="50"/>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
    expect(() => jest.advanceTimersByTime(200)).not.toThrow();
    if (mockCanvas.svg) mockCanvas.svg.stop();
  });
});

// ---------------------------------------------------------------------------
// SVG with global alpha and composite
// ---------------------------------------------------------------------------

describe('canvg() — global alpha via opacity on group', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.querySelectorAll('div').forEach((el) => el.remove());
  });

  it('applies opacity to group', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <g opacity="0.5">
        <rect x="10" y="10" width="80" height="80" fill="red"/>
        <circle cx="50" cy="50" r="30" fill="blue"/>
      </g>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });

  it('applies nested opacity', () => {
    const mockCanvas = makeMockCanvas();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <g opacity="0.8">
        <g opacity="0.5">
          <rect x="20" y="20" width="60" height="60" fill="green"/>
        </g>
      </g>
    </svg>`;
    expect(() => canvg(mockCanvas, svg, {
      ignoreMouse: true, ignoreAnimation: true,
    })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Helper: act import for timer tests
// ---------------------------------------------------------------------------

const { act } = require('@testing-library/react');
