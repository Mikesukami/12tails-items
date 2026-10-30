import React from 'react';

export default function ItemArt({ kind = 'gem' }) {
  return <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
    {kind === 'sword' ? <>
      <path d="m30 51 3-15L59 12l8 1-1 9-25 26-11 3Z" fill="#d7e9e5" stroke="#7bafa9" strokeWidth="2" />
      <path d="m36 44 26-27M25 45l14 14M30 54 17 67" stroke="#dfba77" strokeWidth="6" strokeLinecap="round" />
      <path d="m29 55-9 9" stroke="#987956" strokeWidth="5" />
    </> : kind === 'shield' ? <>
      <path d="M40 12 62 23v20c0 13-22 26-22 26S18 56 18 43V23l22-11Z" fill="#6c8aa1" stroke="#cbdad9" strokeWidth="3" />
      <path d="m40 22 13 7v14c0 8-13 16-13 16s-13-8-13-16V29l13-7Z" fill="#385a6b" />
      <path d="m40 29 3 9 9 2-9 3-3 10-3-10-9-3 9-2 3-9Z" fill="#dfc98d" />
    </> : kind === 'potion' ? <>
      <path d="M32 15h16v19c16 11 18 32-8 32S14 45 32 34V15Z" fill="#b8d9c6" stroke="#deeee4" strokeWidth="2" />
      <path d="M25 46h30c6 12-1 16-15 16s-21-4-15-16Z" fill="#79b39b" />
      <path d="M30 13h20v9H30z" fill="#b68e68" /><path d="m31 41-5 11" stroke="#f2fff4" strokeWidth="3" strokeLinecap="round" />
    </> : <>
      <path d="m40 12 23 21-8 28-15 9-23-32 8-17 15-9Z" fill="#b9a9db" stroke="#e6dcf4" strokeWidth="2" />
      <path d="m40 12 6 26 17-5M46 38l-6 32M46 38 17 38M25 21l21 17 9 23" stroke="#776b9f" strokeWidth="2" />
      <path d="m40 12-5 25-10-16" fill="#e4dcf2" />
    </>}
  </svg>;
}
