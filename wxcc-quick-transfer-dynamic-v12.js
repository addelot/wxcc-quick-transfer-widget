await Desktop.agentContact.vteamTransferV2({
  interactionId: interactionId,
  data: {
    to: queueId,
    destinationType: "queue"
  }
});
