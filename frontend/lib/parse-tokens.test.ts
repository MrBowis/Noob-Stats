import { parseTokensFromUrl } from './parse-tokens';

describe('parseTokensFromUrl', () => {
  it('extrae tokens del fragmento (#)', () => {
    const url =
      'noobstats://auth-callback#access_token=AAA&refresh_token=BBB&expires_in=3600';
    expect(parseTokensFromUrl(url)).toEqual({
      accessToken: 'AAA',
      refreshToken: 'BBB',
    });
  });

  it('extrae tokens del query (?)', () => {
    const url = 'noobstats://auth-callback?access_token=AAA&refresh_token=BBB';
    expect(parseTokensFromUrl(url)).toEqual({
      accessToken: 'AAA',
      refreshToken: 'BBB',
    });
  });

  it('devuelve null si faltan tokens', () => {
    expect(parseTokensFromUrl('noobstats://auth-callback')).toBeNull();
    expect(
      parseTokensFromUrl('noobstats://auth-callback#access_token=AAA'),
    ).toBeNull();
  });
});
