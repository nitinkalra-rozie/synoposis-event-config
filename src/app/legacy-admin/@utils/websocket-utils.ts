//TODO: this has to be moved to a reusable service and used from both session content component and the stage view deactivation service or anywhere we deactivate the stage view

export function cleanupWebSocketConnectionUtil(
  socket: WebSocket | null,
  eventStreamMarshaller: any,
  getAudioEventMessage: (buffer: Buffer) => any
): null {
  if (socket) {
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      try {
        const emptyMessage = getAudioEventMessage(Buffer.from([]));
        const emptyBuffer = eventStreamMarshaller.marshall(emptyMessage as any);
        socket.send(emptyBuffer);
        socket.close(1000, 'Component destroyed');
      } catch (error) {
        if (
          socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING
        ) {
          socket.close(1000, 'Component destroyed - forced close');
        }
      }
    }
  }
  return null;
}
