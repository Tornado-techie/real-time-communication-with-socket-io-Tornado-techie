import { useState, useCallback } from 'react';

export const useMessageContextMenu = () => {
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    message: null
  });

  const showContextMenu = useCallback((event, message) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      message
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      message: null
    });
  }, []);

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu
  };
};