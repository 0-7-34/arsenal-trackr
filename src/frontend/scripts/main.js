const formations = {
  "4-4-2": {
    GK: [50, 92],
    LB: [20, 75], LCB: [40, 78], RCB: [60, 78], RB: [80, 75],
    LM: [20, 55], LCM: [40, 58], RCM: [60, 58], RM: [80, 55],
    LS: [40, 30], RS: [60, 30]
  }, "4-3-3": {
    GK: [50, 92],
    LB: [20, 75], LCB: [40, 78], RCB: [60, 78], RB: [80, 75],
    LCM: [25, 55], CM: [50, 55], RCM: [75, 55],
    LW: [20, 30], ST: [50, 25], RW: [80, 30]
  }
};

function applyFormation(name) {
  document.querySelectorAll(".player").forEach(p => {
    const pos = p.dataset.position;
    const coords = formations[name]?.[pos];

    if (!coords) return;

    const [x, y] = coords;
    p.style.left = `${x}vw`;
    p.style.top = `${y}vh`;
  });
}

// default
applyFormation("4-3-3");