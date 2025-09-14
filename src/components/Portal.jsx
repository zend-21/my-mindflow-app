// src/components/Portal.jsx

import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

function Portal({ children, wrapperId = "modal-root" }) {
  const [wrapperElement, setWrapperElement] = useState(null);

  useLayoutEffect(() => {
    const element = document.getElementById(wrapperId);
    setWrapperElement(element);
  }, [wrapperId]);

  if (wrapperElement === null) return null;

  return createPortal(children, wrapperElement);
}

export default Portal;