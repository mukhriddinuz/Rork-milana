// react-dom ships without bundled types in this project and is only used
// for the web-only createPortal path. A minimal ambient declaration keeps
// the type-checker happy without pulling in @types/react-dom.
declare module 'react-dom';
