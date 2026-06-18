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

  it('el fragmento tiene precedencia sobre el query cuando ambos están presentes', () => {
    const url =
      'noobstats://auth-callback?access_token=QUERY_AT&refresh_token=QUERY_RT#access_token=FRAG_AT&refresh_token=FRAG_RT';
    expect(parseTokensFromUrl(url)).toEqual({
      accessToken: 'FRAG_AT',
      refreshToken: 'FRAG_RT',
    });
  });

  it('devuelve null si no hay ni query ni fragmento', () => {
    expect(parseTokensFromUrl('noobstats://auth-callback')).toBeNull();
  });

  it('devuelve null si faltan tokens (solo access_token)', () => {
    expect(
      parseTokensFromUrl('noobstats://auth-callback#access_token=AAA'),
    ).toBeNull();
  });

  it('devuelve null si faltan tokens (solo refresh_token)', () => {
    expect(
      parseTokensFromUrl('noobstats://auth-callback#refresh_token=BBB'),
    ).toBeNull();
  });

  it('decodifica correctamente tokens con caracteres URL-encoded', () => {
    const at = 'eyJh+bGci/OiJIUzI1NiJ9';
    const rt = 'v1.refresh+token/value==';
    const url = `noobstats://auth-callback#access_token=${encodeURIComponent(at)}&refresh_token=${encodeURIComponent(rt)}`;
    expect(parseTokensFromUrl(url)).toEqual({
      accessToken: at,
      refreshToken: rt,
    });
  });
});
