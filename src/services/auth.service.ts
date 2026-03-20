import { zabbixRequest } from '../api/zabbix.client';
import type { ZabbixUser } from '../api/zabbix.types';

export interface LoginCredentials {
  serverUrl: string;
  username: string;
  password: string;
}

export interface LoginResult {
  token: string; //sessionId
  user: ZabbixUser;
  apiVersion: string;
}

export async function loginToZabbix(credentials: LoginCredentials,): Promise<LoginResult> {
  const { serverUrl, username, password } = credentials;

  // 1. Busca a versão da API (sem autenticação)
  const apiVersion = await zabbixRequest<string>(
    serverUrl,
    'apiinfo.version',
    {},
  );


  // 2. Realiza o login — Zabbix 6.4+ usa "username", versões antigas usam "user"
  const majorVersion = parseInt(apiVersion.split('.')[0], 10);
  const minorVersion = parseInt(apiVersion.split('.')[1], 10);
  const usesUsernameField = majorVersion > 6 || (majorVersion === 6 && minorVersion >= 4);
  
  const loginParams = usesUsernameField
  ? { username, password }
  : { user: username, password };
  
  const user = await zabbixRequest<ZabbixUser>(
    serverUrl,
    'user.login',
    { ...loginParams, userData: true }
  );
  

  // // 3. Busca dados do usuário autenticado
  // const users = await zabbixRequest<ZabbixUser[]>(
  //   serverUrl,
  //   'user.get',
  //   {
  //     output: ['userid', 'username', 'name', 'surname', 'type'],

  //   },
  //   user.sessionid
  // );

  return {
    token: user.sessionid,
    user: user,
    apiVersion,
  };
}

export async function logoutFromZabbix(
  serverUrl: string,
  token: string,
): Promise<void> {
  try {
    await zabbixRequest(serverUrl, 'user.logout', {}, token);
  } catch {
    // Logout silencioso — token pode já ter expirado
  }
}