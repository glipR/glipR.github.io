<script type="module" src="../js/flow.js" async></script>

@flow (~
V:
  A: [20, 40]
  B: [250, 120]
  C: [100, 300]
E:
- start: A
  end:   C
- start: A
  end:   B
- start: B
  end:   C
~)
