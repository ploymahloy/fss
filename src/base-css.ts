export const FSS_BASE_CSS = `
:host {
  display: block;
  contain: content;
}

:host * {
  all: unset;
  display: revert; // IMPORTANT! Keeps <div> as block and <span> as inline
  box-sizing: border-box;
  font-family: inherit;
}
`.trim();
