import { strict as assert } from 'node:assert';
import { afterEach, describe, it } from 'node:test';
import { Client as ColyseusClient, Room as ClientRoom } from '@colyseus/sdk';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import type { AddressInfo } from 'node:net';
import { NightshiftRoomState } from '@nightshift/protocol';
import { NightshiftRoom } from './nightshift-room';
import type { EstimatePublicView } from '@nightshift/games-estimate';
import type { CluesPlayerView, CluesPublicView } from '@nightshift/games-restricted-clues';
import type { ServerMessage } from '@nightshift/protocol';
import type { MajorityPublicView } from '@nightshift/games-majority-rules';
import type { OneOfUsPublicView, OneOfUsPlayerView } from '@nightshift/games-one-of-us';
import type { InfiltratorPublicView, InfiltratorPlayerView } from '@nightshift/games-human-exe';

let activeServer: Server | null = null;

describe('NightshiftRoom smoke flow', () => {
  it('keeps the host ready across settings, game changes and lobby returns without a ready action', async () => {
    const {client}=await startServer();
    const host=await client.create<NightshiftRoomState>('nightshift_room',{nickname:'Host'});
    host.onMessage('serverMessage',()=>{});
    await waitFor(()=>host.state.players?.get(host.sessionId)?.ready===true);
    host.send('clientMessage',{type:'SET_READY',ready:false});
    host.send('clientMessage',{type:'SELECT_GAME',gameId:'estimate'});
    host.send('clientMessage',{type:'SET_ESTIMATE_OPTIONS',deck:'wildlife',difficulty:'hard',daily:true});
    await waitFor(()=>host.state.estimateDaily && host.state.estimateDeck==='wildlife');
    assert.equal(host.state.players?.get(host.sessionId)?.ready,true);
    host.send('clientMessage',{type:'START_GAME'});
    await waitFor(()=>host.state.phase==='PLAYING');
    host.send('clientMessage',{type:'RETURN_TO_LOBBY'});
    await waitFor(()=>host.state.phase==='LOBBY');
    assert.equal(host.state.players?.get(host.sessionId)?.ready,true);
    host.send('clientMessage',{type:'SELECT_GAME',gameId:'pick-number'});
    host.send('clientMessage',{type:'START_GAME'});
    await waitFor(()=>host.state.phase==='PLAYING');
    assert.equal(host.state.activeGame.gameId,'pick-number');
    await host.leave();
  });
  it('keeps Estimate replay history through the lobby and shares fresh mixed questions with both players', async () => {
    const {client}=await startServer();
    const host=await client.create<NightshiftRoomState>('nightshift_room',{nickname:'Fresh host'});
    const guest=await client.joinById<NightshiftRoomState>(host.roomId,{nickname:'Fresh guest'});
    for(const room of [host,guest]) room.onMessage('serverMessage',()=>{});
    host.send('clientMessage',{type:'SELECT_GAME',gameId:'estimate'});
    host.send('clientMessage',{type:'SET_ESTIMATE_OPTIONS',deck:'mixed',difficulty:'standard',daily:false});
    await waitFor(()=>guest.state.estimateDeck==='mixed');
    const seen=new Set<string>();
    const view=()=>JSON.parse(host.state.activeGame.publicViewJson) as EstimatePublicView;
    for(let run=0;run<2;run++) {
      for(const room of [host,guest]) room.send('clientMessage',{type:'SET_READY',ready:true});
      await waitFor(()=>[...host.state.players.values()].every(player=>player.ready));
      host.send('clientMessage',{type:'START_GAME'});
      await waitFor(()=>host.state.phase==='PLAYING' && guest.state.phase==='PLAYING');
      for(let round=1;round<=5;round++) {
        await waitFor(()=>JSON.parse(guest.state.activeGame.publicViewJson).round===round);
        const question=view().prompt.question;
        assert.equal(seen.has(question),false); seen.add(question);
        assert.equal(JSON.parse(guest.state.activeGame.publicViewJson).prompt.question,question);
        assert.equal('answer' in view().prompt,false);
        for(const room of [host,guest]) room.send('clientMessage',{type:'GAME_ACTION',action:{type:'ESTIMATE_SUBMIT',round,value:100}});
        await waitFor(()=>view().phase==='REVEAL');
        host.send('clientMessage',{type:'GAME_ACTION',action:{type:'ESTIMATE_NEXT_ROUND',round}});
        await waitFor(()=>view().phase===(round===5?'RESULTS':'SUBMISSION'));
      }
      host.send('clientMessage',{type:'RETURN_TO_LOBBY'});
      await waitFor(()=>host.state.phase==='LOBBY' && guest.state.phase==='LOBBY');
    }
    assert.equal(seen.size,10);
    await guest.leave(); await host.leave();
  });
  it('remembers presented Human.exe questions across abandoned games in the same room', async () => {
    const {client}=await startServer();
    const host=await client.create<NightshiftRoomState>('nightshift_room',{nickname:'Variety host'});
    host.onMessage('serverMessage',()=>{});
    host.send('clientMessage',{type:'SELECT_GAME',gameId:'human-exe'});
    const seen=new Set<string>();
    for(let run=0;run<8;run++) {
      host.send('clientMessage',{type:'SET_READY',ready:true});
      host.send('clientMessage',{type:'START_GAME'});
      await waitFor(()=>host.state.phase==='PLAYING');
      const view=JSON.parse(host.state.activeGame.publicViewJson);
      assert.equal(seen.has(view.question),false); seen.add(view.question);
      assert.ok(view.options.length===3 || view.options.length===4);
      assert.equal('deck' in view,false); assert.equal(view.result,null);
      host.send('clientMessage',{type:'RETURN_TO_LOBBY'});
      await waitFor(()=>host.state.phase==='LOBBY');
    }
    await host.leave();
  });
  it('shares daily sets across independent rooms and rolls automatic replays over at UTC midnight', async (t) => {
    t.mock.timers.enable({apis:['Date'],now:Date.parse('2026-09-15T23:59:55Z')});
    const {client}=await startServer();
    const rooms=await Promise.all([client.create<NightshiftRoomState>('nightshift_room',{nickname:'Daily A'}),client.create<NightshiftRoomState>('nightshift_room',{nickname:'Daily B'})]);
    for(const room of rooms) {
      room.onMessage('serverMessage',()=>{});
      room.send('clientMessage',{type:'SELECT_GAME',gameId:'estimate'});
      room.send('clientMessage',{type:'SET_ESTIMATE_OPTIONS',deck:'generated',difficulty:'standard',daily:true});
      room.send('clientMessage',{type:'SET_READY',ready:true});
      room.send('clientMessage',{type:'START_GAME'});
    }
    await waitFor(()=>rooms.every(room=>room.state.phase==='PLAYING'));
    const views=()=>rooms.map(room=>JSON.parse(room.state.activeGame.publicViewJson) as EstimatePublicView);
    const firstQuestion=views()[0]!.prompt.question;
    for(let round=1;round<=5;round++) {
      const [a,b]=views();assert.deepEqual(a!.prompt,b!.prompt);
      assert.equal(a!.dailyId,'v3:2026-09-15');assert.equal('answer' in a!.prompt,false);
      if(round===1) t.mock.timers.tick(6_000);
      for(const room of rooms) room.send('clientMessage',{type:'GAME_ACTION',action:{type:'ESTIMATE_SUBMIT',round,value:100}});
      await waitFor(()=>views().every(view=>view.phase==='REVEAL'));
      assert.deepEqual(views()[0]!.latestResult!.prompt,views()[1]!.latestResult!.prompt);
      for(const room of rooms) room.send('clientMessage',{type:'GAME_ACTION',action:{type:'ESTIMATE_NEXT_ROUND',round}});
      await waitFor(()=>views().every(view=>view.phase===(round===5?'RESULTS':'SUBMISSION')));
    }
    assert.ok(rooms.every(room=>room.state.activeGame.mode==='daily:v3:2026-09-15:estimate:generated:standard:solo'));
    for(const room of rooms) room.send('clientMessage',{type:'VOTE_NEXT_GAME',gameId:'estimate'});
    await waitFor(()=>rooms.every(room=>room.state.nextGameVotes.size===1));
    t.mock.timers.tick(15_001);
    await waitFor(()=>views().every(view=>view.phase==='SUBMISSION'));
    assert.equal(views()[0]!.dailyId,'v3:2026-09-16');assert.deepEqual(views()[0]!.prompt,views()[1]!.prompt);
    assert.notEqual(views()[0]!.prompt.question,firstQuestion);
    assert.equal(rooms[0]!.state.activeGame.mode,'daily:v3:2026-09-16:estimate:generated:standard:solo');
    await leave(...rooms);
  });
  it('enforces Estimate options, hides factual answers, and keeps settings across automatic replay', async (t) => {
    t.mock.timers.enable({apis:['Date'],now:Date.now()});
    const {client}=await startServer();
    const host=await client.create<NightshiftRoomState>('nightshift_room',{nickname:'Host'});
    const guest=await client.joinById<NightshiftRoomState>(host.roomId,{nickname:'Guest'});
    const errors:string[]=[];
    for(const room of [host,guest]) room.onMessage('serverMessage',(message:ServerMessage)=>{if(message.type==='ERROR')errors.push(message.code);});
    host.send('clientMessage',{type:'SELECT_GAME',gameId:'estimate'});
    for(const room of [host,guest]) room.send('clientMessage',{type:'SET_READY',ready:true});
    await waitFor(()=>host.state.players?.get(host.sessionId)?.ready===true && host.state.players?.get(guest.sessionId)?.ready===true);
    guest.send('clientMessage',{type:'SET_ESTIMATE_OPTIONS',deck:'facts',difficulty:'hard'});
    await waitFor(()=>errors.includes('host_only'));
    assert.equal(host.state.estimateDeck,'generated');
    host.send('clientMessage',{type:'SET_ESTIMATE_OPTIONS',deck:'facts',difficulty:'impossible'});
    await waitFor(()=>errors.includes('invalid_message'));
    host.send('clientMessage',{type:'SET_ESTIMATE_OPTIONS',deck:'facts',difficulty:'hard'});
    await waitFor(()=>guest.state.estimateDeck==='facts' && guest.state.estimateDifficulty==='hard');
    assert.equal(guest.state.players?.get(host.sessionId)?.ready,true);
    assert.equal(guest.state.players?.get(guest.sessionId)?.ready,false);
    for(const room of [host,guest]) room.send('clientMessage',{type:'SET_READY',ready:true});
    await waitFor(()=>[...host.state.players.values()].every(player=>player.ready));
    host.send('clientMessage',{type:'START_GAME'});
    await waitFor(()=>host.state.phase==='PLAYING');
    const view=()=>JSON.parse(host.state.activeGame.publicViewJson) as EstimatePublicView;
    assert.equal(host.state.activeGame.mode,'estimate:facts:hard:multiplayer');
    host.send('clientMessage',{type:'SET_ESTIMATE_OPTIONS',deck:'generated',difficulty:'easy'});
    await waitFor(()=>errors.includes('not_in_lobby'));
    const runId=host.state.activeGame.runId;
    for(let round=1;round<=5;round++) {
      assert.equal(view().deck,'facts'); assert.equal(view().difficulty,'hard');
      assert.equal('source' in view().prompt,false); assert.equal('answer' in view().prompt,false);
      host.send('clientMessage',{type:'GAME_ACTION',action:{type:'ESTIMATE_SUBMIT',round,value:1000}});
      await waitFor(()=>view().submittedPlayerIds.includes(host.sessionId));
      assert.equal(view().phase,'SUBMISSION');
      guest.send('clientMessage',{type:'GAME_ACTION',action:{type:'ESTIMATE_SUBMIT',round,value:1000}});
      await waitFor(()=>view().phase==='REVEAL');
      assert.ok(view().latestResult!.prompt.source!.url.startsWith('https://science.nasa.gov/'));
      host.send('clientMessage',{type:'GAME_ACTION',action:{type:'ESTIMATE_NEXT_ROUND',round}});
      await waitFor(()=>view().phase===(round===5?'RESULTS':'SUBMISSION'));
    }
    host.send('clientMessage',{type:'VOTE_NEXT_GAME',gameId:'estimate'});
    await waitFor(()=>host.state.nextGameVotes.size===1);
    t.mock.timers.tick(15_001);
    await waitFor(()=>host.state.activeGame.runId!==runId);
    assert.equal(view().deck,'facts'); assert.equal(view().difficulty,'hard');
    assert.equal(host.state.activeGame.mode,'estimate:facts:hard:multiplayer');
    assert.equal(view().history.length,0);
    await leave(host,guest);
  });
  it('plays three anonymous Infiltrator rounds over the transport and rotates to the elected game', async (t) => {
    t.mock.timers.enable({apis:['Date'],now:Date.now()});
    const {client}=await startServer();
    const host=await client.create<NightshiftRoomState>('nightshift_room',{nickname:'Host'});
    const second=await client.joinById<NightshiftRoomState>(host.roomId,{nickname:'Second'});
    const third=await client.joinById<NightshiftRoomState>(host.roomId,{nickname:'Third'});
    const rooms=[host,second,third],privateViews=new Map<string,InfiltratorPlayerView>();
    for(const room of rooms) {
      room.onMessage('serverMessage',(message:ServerMessage)=>{if(message.type==='PRIVATE_VIEW'&&message.gameId==='human-infiltrator')privateViews.set(room.sessionId,message.view as InfiltratorPlayerView);});
      room.send('clientMessage',{type:'SET_READY',ready:true});
    }
    host.send('clientMessage',{type:'SELECT_GAME',gameId:'human-infiltrator'});
    await waitFor(()=>rooms.every(room=>host.state.players?.get(room.sessionId)?.ready));
    host.send('clientMessage',{type:'START_GAME'});
    const view=()=>JSON.parse(host.state.activeGame.publicViewJson) as InfiltratorPublicView;
    await waitFor(()=>host.state.activeGame.gameId==='human-infiltrator');
    const runId=host.state.activeGame.runId;
    const machines=new Set<string>();
    for(let round=1;round<=3;round++) {
      await waitFor(()=>rooms.every(room=>privateViews.get(room.sessionId)?.round===round));
      const machine=rooms.find(room=>privateViews.get(room.sessionId)?.role==='MACHINE')!;
      machines.add(machine.sessionId);
      assert.equal(view().result,null);assert.deepEqual(view().cards,[]);assert.equal('machine' in view(),false);
      const humans=rooms.filter(room=>room!==machine);
      assert.ok(humans.every(room=>privateViews.get(room.sessionId)?.codeWord===null));
      machine.send('clientMessage',{type:'GAME_ACTION',action:{type:'INFILTRATOR_RESPOND',round,text:`A very ${privateViews.get(machine.sessionId)!.codeWord} snack`}});
      await waitFor(()=>view().submittedPlayerIds.length===1);
      assert.deepEqual(view().cards,[]);
      for(const room of humans) room.send('clientMessage',{type:'GAME_ACTION',action:{type:'INFILTRATOR_RESPOND',round,text:'I need a little coffee.'}});
      await waitFor(()=>host.state.activeGame.phase==='DISCUSSION'&&!!privateViews.get(machine.sessionId)?.ownCard);
      assert.equal('authors' in view(),false);assert.equal(view().cards.length,3);
      t.mock.timers.tick(view().timerEndsAt-Date.now());
      await waitFor(()=>host.state.activeGame.phase==='VOTING');
      const machineCard=privateViews.get(machine.sessionId)!.ownCard!;
      humans[0]!.send('clientMessage',{type:'GAME_ACTION',action:{type:'INFILTRATOR_VOTE',round,cardId:machineCard}});
      await waitFor(()=>view().votedPlayerIds.length===1);
      assert.equal(view().result,null);assert.equal(privateViews.get(machine.sessionId)?.vote,null);
      humans[1]!.send('clientMessage',{type:'GAME_ACTION',action:{type:'INFILTRATOR_VOTE',round,cardId:machineCard}});
      machine.send('clientMessage',{type:'GAME_ACTION',action:{type:'INFILTRATOR_VOTE',round,cardId:view().cards.find(card=>card.id!==machineCard)!.id}});
      await waitFor(()=>host.state.activeGame.phase==='REVEAL');
      assert.equal(view().result!.machine,machine.sessionId);assert.equal(view().result!.accused,machine.sessionId);
      host.send('clientMessage',{type:'GAME_ACTION',action:{type:'INFILTRATOR_NEXT',round}});
      await waitFor(()=>host.state.activeGame.phase===(round===3?'RESULTS':'SUBMISSION'));
    }
    assert.equal(machines.size,3);assert.equal(host.state.activeGame.mode,'multiplayer');
    assert.ok(rooms.every(room=>host.state.players?.get(room.sessionId)?.score===200));
    for(const room of rooms) room.send('clientMessage',{type:'VOTE_NEXT_GAME',gameId:'majority-rules'});
    await waitFor(()=>host.state.nextGameVotes.size===3);
    t.mock.timers.tick(15_001);
    await waitFor(()=>host.state.activeGame.gameId==='majority-rules');
    assert.notEqual(host.state.activeGame.runId,runId);
    assert.equal(host.state.nextGameVotes.size,0);
    await leave(...rooms);
  });
  it('hands host control over after a brief drop and preserves the returning player seat', async (t) => {
    t.mock.timers.enable({apis:['Date'],now:Date.now()});
    const {client}=await startServer();
    const host=await client.create<NightshiftRoomState>('nightshift_room',{nickname:'Host'});
    const guest=await client.joinById<NightshiftRoomState>(host.roomId,{nickname:'Guest'});
    host.onMessage('serverMessage',()=>{}); guest.onMessage('serverMessage',()=>{});
    const token=host.reconnectionToken;
    const originalId=host.sessionId;
    await host.leave(false);
    await waitFor(()=>guest.state.players?.get(originalId)?.connected===false);
    assert.equal(guest.state.hostPlayerId,originalId);
    t.mock.timers.tick(10_001);
    await waitFor(()=>guest.state.hostPlayerId===guest.sessionId);
    assert.equal(guest.state.players?.get(guest.sessionId)?.ready,true);
    guest.send('clientMessage',{type:'SELECT_GAME',gameId:'estimate'});
    await waitFor(()=>guest.state.selectedGameId==='estimate');
    const returned=await client.reconnect<NightshiftRoomState>(token);
    returned.onMessage('serverMessage',()=>{});
    await waitFor(()=>guest.state.players?.get(originalId)?.connected===true);
    assert.equal(returned.sessionId,originalId);
    assert.equal(guest.state.hostPlayerId,guest.sessionId);
    assert.equal(guest.state.players?.get(originalId)?.host,false);
    await leave(returned,guest);
  });
  it('plays Majority Rules, elects One of Us Is Lying, and completes its private clue/vote flow', async (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: Date.now() });
    const { client } = await startServer();
    const host = await client.create<NightshiftRoomState>('nightshift_room', { nickname: 'Host' });
    const second = await client.joinById<NightshiftRoomState>(host.roomId, { nickname: 'Second' });
    const third = await client.joinById<NightshiftRoomState>(host.roomId, { nickname: 'Third' });
    const rooms = [host, second, third];
    const privateViews = new Map<string, OneOfUsPlayerView>();
    for (const room of rooms) {
      room.onMessage('serverMessage', (message: ServerMessage) => {
        if (message.type === 'PRIVATE_VIEW' && message.gameId === 'one-of-us') privateViews.set(room.sessionId, message.view as OneOfUsPlayerView);
      });
      room.send('clientMessage', { type: 'SET_READY', ready: true });
    }
    host.send('clientMessage', { type: 'SELECT_GAME', gameId: 'majority-rules' });
    await waitFor(() => rooms.every(room => host.state.players?.get(room.sessionId)?.ready));
    host.send('clientMessage', { type: 'START_GAME' });
    await waitFor(() => host.state.activeGame.gameId === 'majority-rules');
    for (const room of rooms) room.send('clientMessage', { type: 'VOTE_NEXT_GAME', gameId: 'one-of-us' });
    await waitFor(() => host.state.nextGameVotes.size === 3);
    for (let round = 1; round <= 5; round++) {
      for (const room of rooms) room.send('clientMessage', { type:'GAME_ACTION', action:{type:'MAJORITY_SUBMIT',round,choice:'A',prediction:'A'} });
      await waitFor(() => host.state.activeGame.phase === 'REVEAL');
      const view = JSON.parse(host.state.activeGame.publicViewJson) as MajorityPublicView;
      assert.deepEqual(view.result?.counts,{A:3,B:0});
      assert.equal(host.state.players?.get(host.sessionId)?.score,round*100);
      host.send('clientMessage',{type:'GAME_ACTION',action:{type:'MAJORITY_NEXT',round}});
      await waitFor(() => host.state.activeGame.phase === (round === 5 ? 'RESULTS':'SUBMISSION'));
    }
    t.mock.timers.tick(15001);
    await waitFor(() => host.state.activeGame.gameId === 'one-of-us');
    assert.equal(host.state.nextGameVotes.size,0);
    assert.equal(host.state.players?.get(host.sessionId)?.score,0);
    const seen = new Set<string>();
    const view = () => JSON.parse(host.state.activeGame.publicViewJson) as OneOfUsPublicView;
    for (let round=1;round<=3;round++) {
      await waitFor(() => privateViews.size === 3 && [...privateViews.values()].every(v => v.round === round));
      const bluffer = rooms.find(room => privateViews.get(room.sessionId)?.role === 'BLUFFER')!;
      seen.add(bluffer.sessionId);
      assert.equal(privateViews.get(bluffer.sessionId)?.word,null);
      const informed = rooms.filter(room => room !== bluffer);
      assert.ok(privateViews.get(informed[0]!.sessionId)?.word);
      assert.deepEqual(view().clues,{}); assert.equal(view().result,null);
      rooms[0]!.send('clientMessage',{type:'GAME_ACTION',action:{type:'LYING_CLUE',round,text:'interesting object'}});
      await waitFor(() => view().submittedPlayerIds.length === 1);
      assert.deepEqual(view().clues,{});
      for (const room of rooms.slice(1)) room.send('clientMessage',{type:'GAME_ACTION',action:{type:'LYING_CLUE',round,text:'quite unusual'}});
      await waitFor(() => host.state.activeGame.phase === 'DISCUSSION');
      assert.equal(Object.keys(view().clues).length,3);
      second.send('clientMessage',{type:'GAME_ACTION',action:{type:'LYING_DISCUSS',round,text:'That clue feels suspicious.'}});
      await waitFor(() => view().discussion.length === 1);
      t.mock.timers.tick(view().timerEndsAt-Date.now());
      await waitFor(() => host.state.activeGame.phase === 'VOTING');
      informed[0]!.send('clientMessage',{type:'GAME_ACTION',action:{type:'LYING_VOTE',round,targetPlayerId:bluffer.sessionId}});
      await waitFor(() => view().votedPlayerIds.length === 1);
      assert.equal(view().result,null); assert.equal('votes' in view(),false);
      informed[1]!.send('clientMessage',{type:'GAME_ACTION',action:{type:'LYING_VOTE',round,targetPlayerId:bluffer.sessionId}});
      bluffer.send('clientMessage',{type:'GAME_ACTION',action:{type:'LYING_VOTE',round,targetPlayerId:informed[0]!.sessionId}});
      await waitFor(() => host.state.activeGame.phase === 'REVEAL');
      assert.equal(view().result?.accused,bluffer.sessionId);
      host.send('clientMessage',{type:'GAME_ACTION',action:{type:'LYING_NEXT',round}});
      await waitFor(() => host.state.activeGame.phase === (round===3?'RESULTS':'CLUES'));
    }
    assert.equal(seen.size,3);
    assert.equal(host.state.phase,'SCOREBOARD');
    for (const room of rooms) assert.equal(host.state.players?.get(room.sessionId)?.score,200);
    host.send('clientMessage',{type:'RETURN_TO_LOBBY'});
    await waitFor(() => host.state.phase === 'LOBBY');
    await leave(...rooms);
  });
  it('keeps clues private, counts player votes, and automatically starts the elected game', async () => {
    const { client } = await startServer();
    const host = await client.create<NightshiftRoomState>('nightshift_room', { nickname: 'Host' });
    const guest = await client.joinById<NightshiftRoomState>(host.roomId, { nickname: 'Guest' });
    const privateViews = new Map<string, CluesPlayerView>();
    for (const room of [host, guest]) room.onMessage('serverMessage', (message: ServerMessage) => {
      if (message.type === 'PRIVATE_VIEW' && message.gameId === 'restricted-clues') privateViews.set(room.sessionId, message.view as CluesPlayerView);
    });
    host.send('clientMessage', { type: 'SELECT_GAME', gameId: 'restricted-clues' });
    host.send('clientMessage', { type: 'SET_READY', ready: true });
    guest.send('clientMessage', { type: 'SET_READY', ready: true });
    await waitFor(() => host.state.players?.get(guest.sessionId)?.ready === true);
    host.send('clientMessage', { type: 'START_GAME' });
    await waitFor(() => host.state.activeGame.gameId === 'restricted-clues');
    host.send('clientMessage', { type: 'VOTE_NEXT_GAME', gameId: 'estimate' });
    guest.send('clientMessage', { type: 'VOTE_NEXT_GAME', gameId: 'human-exe' });
    host.send('clientMessage', { type: 'VOTE_NEXT_GAME', gameId: 'human-exe' });
    await waitFor(() => host.state.nextGameVotes.get(host.sessionId) === 'human-exe' && host.state.nextGameVotes.get(guest.sessionId) === 'human-exe');
    const view = () => JSON.parse(host.state.activeGame.publicViewJson) as CluesPublicView;
    for (let round = 1; round <= 4; round++) {
      await waitFor(() => [...privateViews.values()].every(v => v.round === round));
      const giverId = view().giver;
      const guesser = giverId === host.sessionId ? guest : host;
      assert.equal(view().answer, null);
      assert.equal(privateViews.get(guesser.sessionId)?.word, null);
      const word = privateViews.get(giverId)!.word!;
      assert.ok(word);
      guesser.send('clientMessage', { type: 'GAME_ACTION', action: { type: 'CLUES_GUESS', round, text: word } });
      await waitFor(() => host.state.activeGame.phase === 'REVEAL');
      assert.equal(view().answer, word);
      host.send('clientMessage', { type: 'GAME_ACTION', action: { type: 'CLUES_NEXT', round } });
      await waitFor(() => host.state.activeGame.phase === (round === 4 ? 'RESULTS' : 'CLUES'));
    }
    assert.equal(host.state.phase, 'SCOREBOARD');
    assert.ok(host.state.nextGameStartsAt > Date.now());
    assert.equal(host.state.players?.get(host.sessionId)?.score, 400);
    await waitFor(() => host.state.activeGame.gameId === 'human-exe', 18000);
    assert.equal(host.state.phase, 'PLAYING');
    assert.equal(host.state.activeGame.round, 1);
    assert.equal(host.state.nextGameVotes.size, 0);
    assert.equal(host.state.nextGameStartsAt, 0);
    assert.equal(host.state.players?.get(host.sessionId)?.score, 0);
    await leave(host, guest);
  });
  afterEach(async () => {
    if (activeServer) {
      await activeServer.gracefullyShutdown(false);
      activeServer = null;
    }
  });

  it('plays Estimate with two clients, handles a departure, and returns to a fresh lobby', async () => {
    const { client } = await startServer();
    const host = await client.create<NightshiftRoomState>('nightshift_room', { nickname: 'Host' });
    const guest = await client.joinById<NightshiftRoomState>(host.roomId, { nickname: 'Guest' });
    host.onMessage('serverMessage', () => undefined);
    guest.onMessage('serverMessage', () => undefined);
    host.send('clientMessage', { type: 'SELECT_GAME', gameId: 'estimate' });
    host.send('clientMessage', { type: 'SET_READY', ready: true });
    guest.send('clientMessage', { type: 'SET_READY', ready: true });
    await waitFor(() => host.state.players?.get(guest.sessionId)?.ready === true);
    host.send('clientMessage', { type: 'START_GAME' });
    await waitFor(() => host.state.activeGame.gameId === 'estimate');
    const view = () => JSON.parse(host.state.activeGame.publicViewJson) as EstimatePublicView;
    assert.equal('answer' in view().prompt, false);
    for (let round = 1; round <= 5; round++) {
      host.send('clientMessage', { type: 'GAME_ACTION', action: { type: 'ESTIMATE_SUBMIT', round, value: 100 } });
      if (round === 1) {
        await waitFor(() => view().submittedPlayerIds.includes(host.sessionId));
        assert.equal(view().phase, 'SUBMISSION');
        assert.equal(view().latestResult, null);
        guest.send('clientMessage', { type: 'GAME_ACTION', action: { type: 'ESTIMATE_SUBMIT', round, value: 100 } });
      } else if (round === 2) {
        await waitFor(() => view().submittedPlayerIds.includes(host.sessionId));
        await leave(guest);
      }
      await waitFor(() => host.state.activeGame.phase === 'REVEAL');
      assert.equal(view().history.length, round);
      assert.equal(host.state.players?.get(host.sessionId)?.score, view().scores[host.sessionId]);
      host.send('clientMessage', { type: 'GAME_ACTION', action: { type: 'ESTIMATE_NEXT_ROUND', round } });
      await waitFor(() => host.state.activeGame.phase === (round === 5 ? 'RESULTS' : 'SUBMISSION'));
    }
    assert.equal(host.state.phase, 'SCOREBOARD');
    assert.equal(host.state.activeGame.mode, 'estimate:generated:standard:mixed');
    host.send('clientMessage', { type: 'RETURN_TO_LOBBY' });
    await waitFor(() => host.state.phase === 'LOBBY');
    assert.equal(host.state.nextGameStartsAt, 0);
    assert.equal(host.state.nextGameVotes.size, 0);
    assert.equal(host.state.players?.get(host.sessionId)?.ready, true);
    host.send('clientMessage', { type: 'SET_READY', ready: true });
    host.send('clientMessage', { type: 'START_GAME' });
    await waitFor(() => host.state.phase === 'PLAYING');
    assert.equal(view().round, 1);
    assert.equal(view().history.length, 0);
    assert.equal(host.state.players?.get(host.sessionId)?.score, 0);
    await leave(host);
  });

  it('creates a room, joins by room code, and reaches Pick a Number reveal', async () => {
    const { client, cleanup } = await startServer();
    const host = await client.create<NightshiftRoomState>('nightshift_room', {
      nickname: 'Samuel',
      avatarId: 'moon'
    });
    const guest = await client.joinById<NightshiftRoomState>(host.roomId, {
      nickname: 'Alice',
      avatarId: 'spark'
    });
    host.onMessage('serverMessage', () => undefined);
    guest.onMessage('serverMessage', () => undefined);

    host.send('clientMessage', { type: 'SET_READY', ready: true });
    guest.send('clientMessage', { type: 'SET_READY', ready: true });
    await waitFor(() => host.state.players?.get(host.sessionId)?.ready === true);
    await waitFor(() => guest.state.players?.get(guest.sessionId)?.ready === true);

    host.send('clientMessage', { type: 'START_GAME' });
    await waitFor(() => host.state.phase === 'PLAYING');

    host.send('clientMessage', {
      type: 'GAME_ACTION',
      action: { type: 'PICK_NUMBER_SUBMIT', round: 1, value: 4 }
    });
    guest.send('clientMessage', {
      type: 'GAME_ACTION',
      action: { type: 'PICK_NUMBER_SUBMIT', round: 1, value: 5 }
    });

    await waitFor(() => host.state.activeGame.phase === 'REVEAL');
    const publicView = JSON.parse(host.state.activeGame.publicViewJson) as { phase: string };

    assert.match(host.roomId, /^[A-Z2-9]{5}$/);
    assert.equal(publicView.phase, 'REVEAL');
    assert.equal(host.state.players.size, 2);

    await leave(host, guest);
    await cleanup();
  });
});

async function startServer(): Promise<{
  readonly client: ColyseusClient;
  readonly cleanup: () => Promise<void>;
}> {
  const server = new Server({
    transport: new WebSocketTransport()
  });
  server.define('nightshift_room', NightshiftRoom);
  await server.listen(0, '127.0.0.1');
  activeServer = server;

  const httpServer = server.transport.server;

  if (!httpServer) {
    throw new Error('Colyseus transport did not expose an HTTP server.');
  }

  const address = httpServer.address() as AddressInfo;

  return {
    client: new ColyseusClient(`ws://127.0.0.1:${address.port}`),
    cleanup: async () => {
      await server.gracefullyShutdown(false);
      activeServer = null;
    }
  };
}

async function leave(...rooms: ClientRoom<NightshiftRoomState>[]): Promise<void> {
  await Promise.all(rooms.map((room) => room.leave()));
}

async function waitFor(assertion: () => boolean, timeoutMs = 2000): Promise<void> {
  const startedAt = performance.now();

  while (performance.now() - startedAt < timeoutMs) {
    if (assertion()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  throw new Error('Timed out waiting for condition.');
}

