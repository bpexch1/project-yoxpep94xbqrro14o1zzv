import React from 'react';
import {renderToString} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
const server=await createServer({configFile:false,plugins:[react()],resolve:{alias:{'@':path.resolve('src')}},server:{middlewareMode:true,host:'127.0.0.1'},appType:'custom'});
try {
 for(const page of ['FootballMatchDetail','TennisMatchDetail']) {
  const {default:Component}=await server.ssrLoadModule(`/src/pages/${page}.tsx`);
  const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
  const html=renderToString(React.createElement(QueryClientProvider,{client},React.createElement(MemoryRouter,null,React.createElement(Component,{match:{id:'qa',title:'A v B',team1:'A',team2:'B',sport:page.startsWith('Football')?'football':'tennis'},clientData:{cash:0},session:{username:'qa'}}))));
  if(!html.includes('—')) throw new Error(`${page}: missing unavailable-odds state`);
  console.log(`${page}: unavailable feed renders safely`);client.clear();
 }
} finally {await server.close();}
