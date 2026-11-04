// A narrow regression tripwire for two observed rejected outputs. Independent
// scientific review remains mandatory; passing this cannot establish accuracy.
export function knownNobelMisconceptions(id, replies) {
 if(id!=='hk-nobel-01-kagan-discussion-v1')return [];
 const forbidden=['薄荷味係左手手性','葛縷子味係右手手性','左手可能較安全或有效','右手可能無效或有副作用'];
 return replies.flatMap(reply=>forbidden.filter(phrase=>reply.text.replace(/\s/g,'').includes(phrase))
  .map(phrase=>({agentId:reply.agentId,messageId:reply.messageId,phrase})));
}
