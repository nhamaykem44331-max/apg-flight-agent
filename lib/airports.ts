export type Airport = { code: string; city: string; name: string; tags: string[] };

export const AIRPORTS: Airport[] = [
  // VN priority
  ['HAN','Hà Nội','Nội Bài'],['SGN','TP.HCM','Tân Sơn Nhất'],['DAD','Đà Nẵng','Đà Nẵng'],['CXR','Nha Trang','Cam Ranh'],
  ['PQC','Phú Quốc','Phú Quốc'],['VDO','Quảng Ninh','Vân Đồn'],['HPH','Hải Phòng','Cát Bi'],['HUI','Huế','Phú Bài'],
  ['VII','Vinh','Vinh'],['VCA','Cần Thơ','Cần Thơ'],['DLI','Đà Lạt','Liên Khương'],['BMV','Buôn Ma Thuột','Buôn Ma Thuột'],
  ['PXU','Pleiku','Pleiku'],['UIH','Quy Nhơn','Phù Cát'],['TBB','Tuy Hòa','Tuy Hòa'],['VCL','Chu Lai','Chu Lai'],
  ['VCS','Côn Đảo','Côn Đảo'],['THD','Thanh Hóa','Thọ Xuân'],['DIN','Điện Biên','Điện Biên'],
  // INT
  ['BKK','Bangkok','Suvarnabhumi'],['SIN','Singapore','Changi'],['ICN','Seoul','Incheon'],['NRT','Tokyo','Narita'],
  ['KIX','Osaka','Kansai'],['TPE','Taipei','Taoyuan'],['HKG','Hong Kong','Hong Kong Intl'],['PEK','Bắc Kinh','Capital'],
  ['PVG','Thượng Hải','Pudong'],['KUL','Kuala Lumpur','Kuala Lumpur Intl']
].map(([code,city,name]) => ({code: code as string, city: city as string, name: name as string, tags:[String(code), String(city), String(name)]}));

export const POPULAR_ROUTES = [
  { from: 'HAN', to: 'SGN' },
  { from: 'HAN', to: 'DAD' },
  { from: 'SGN', to: 'HAN' },
  { from: 'HAN', to: 'PQC' }
];

export function searchAirport(q: string): Airport[] {
  const t = q.trim().toLowerCase();
  if (!t) return AIRPORTS.slice(0, 20);
  return AIRPORTS.filter(a => a.tags.some(x => x.toLowerCase().includes(t))).slice(0, 20);
}

export const AIRPORT_NAME_MAP = Object.fromEntries(
  AIRPORTS.map(a => [a.code, { city: a.city, airportName: a.name }])
);
