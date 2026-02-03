// Coordinates for all NHKA Gemeentes
// Format: [latitude, longitude]

export interface GemeenteLocation {
  naam: string;
  coordinates: [number, number]; // [lat, lng]
  provinsie: string;
  land: string;
  beskrywing?: string;
}

export const GEMEENTE_LOCATIONS: GemeenteLocation[] = [
  // Gauteng - Johannesburg Area
  { naam: 'Alberton', coordinates: [-26.2678, 28.1219], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Alberton-Wes', coordinates: [-26.2750, 28.0950], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Benoryn', coordinates: [-26.2350, 28.2650], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Boksburg', coordinates: [-26.2125, 28.2517], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Elsburg', coordinates: [-26.2450, 28.2100], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Germiston', coordinates: [-26.2178, 28.1675], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Johannesburg', coordinates: [-26.2041, 28.0473], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Kempten', coordinates: [-26.1000, 28.2300], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Kempton', coordinates: [-26.0969, 28.2294], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Kempton Park-Oos', coordinates: [-26.0850, 28.2550], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Nigel', coordinates: [-26.4319, 28.4753], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Noordrand', coordinates: [-26.0650, 28.1450], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Olifantsfontein', coordinates: [-25.9650, 28.2350], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Parkrand', coordinates: [-26.1350, 28.2200], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Primrose-Oos', coordinates: [-26.1950, 28.2050], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Randburg', coordinates: [-26.0936, 28.0064], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Selcourt', coordinates: [-26.2050, 28.4450], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Springs-Noord', coordinates: [-26.2350, 28.4350], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Springs-Oos', coordinates: [-26.2550, 28.4650], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Witfield', coordinates: [-26.1850, 28.2150], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Zuurfontein', coordinates: [-26.0450, 28.2450], provinsie: 'Gauteng', land: 'Suid-Afrika' },

  // Gauteng - West Rand
  { naam: 'Carletonville', coordinates: [-26.3611, 27.3975], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Horison Roodepoort', coordinates: [-26.1450, 27.8650], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Krugersdorp-Noord', coordinates: [-26.0850, 27.7650], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Krugersdorp-Oos', coordinates: [-26.1050, 27.7950], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Krugersdorp-Wes', coordinates: [-26.1050, 27.7450], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Oberholzer', coordinates: [-26.3450, 27.4150], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Randfontein Midpark', coordinates: [-26.1847, 27.7033], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Westonaria', coordinates: [-26.3186, 27.6456], provinsie: 'Gauteng', land: 'Suid-Afrika' },

  // Gauteng - Pretoria/Tshwane Area
  { naam: 'Centurion-Oos', coordinates: [-25.8650, 28.2050], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Derdepoort', coordinates: [-25.7050, 28.3650], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Elandspoort', coordinates: [-25.7550, 28.1350], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Erasmia', coordinates: [-25.8250, 28.1050], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Meyerspark', coordinates: [-25.7650, 28.3050], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Midstream', coordinates: [-25.9050, 28.1850], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Montana', coordinates: [-25.6950, 28.2250], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Montana-Oos', coordinates: [-25.6850, 28.2550], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Noordelike Pretoria', coordinates: [-25.6750, 28.1950], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Noordwestelike Pretoria', coordinates: [-25.7050, 28.1450], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Oos-Moot', coordinates: [-25.7250, 28.2850], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Pretoria', coordinates: [-25.7479, 28.2293], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Pretoria-Noorderlig', coordinates: [-25.6950, 28.2050], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Pretoria-Oos', coordinates: [-25.7550, 28.2750], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Pretoria-Wes', coordinates: [-25.7550, 28.1650], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Rooihuiskraal', coordinates: [-25.8650, 28.1450], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Silverton', coordinates: [-25.7350, 28.3150], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Swartkop', coordinates: [-25.8050, 28.1750], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Villieria', coordinates: [-25.7150, 28.2350], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Wapadrant', coordinates: [-25.6550, 28.3050], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Wesmoot', coordinates: [-25.7350, 28.1550], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Wonderboom', coordinates: [-25.6650, 28.2150], provinsie: 'Gauteng', land: 'Suid-Afrika' },

  // Gauteng - Vaal Triangle
  { naam: 'Duncanville', coordinates: [-26.5350, 27.8650], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Drie Riviere', coordinates: [-26.6650, 27.9050], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Drie Riviere-Oos', coordinates: [-26.6550, 27.9350], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Heidelberg', coordinates: [-26.5047, 28.3592], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Meyerton', coordinates: [-26.5656, 28.0167], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Meyerton-Suid', coordinates: [-26.5850, 28.0250], provinsie: 'Gauteng', land: 'Suid-Afrika' },

  // Gauteng - Bronkhorstspruit
  { naam: 'Bronkhorstspruit', coordinates: [-25.8117, 28.7456], provinsie: 'Gauteng', land: 'Suid-Afrika' },

  // Mpumalanga
  { naam: 'Barberton', coordinates: [-25.7847, 31.0525], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Bethal', coordinates: [-26.4575, 29.4622], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Breyten', coordinates: [-26.3050, 29.9850], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Chrissiesmeer', coordinates: [-26.2950, 30.2150], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Delmas', coordinates: [-26.1500, 28.6833], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Ermelo', coordinates: [-26.5267, 29.9833], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Greylingstad', coordinates: [-26.7350, 28.7650], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Hoedspruit', coordinates: [-24.3547, 30.9653], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Kampersrus', coordinates: [-24.5250, 30.8350], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Komatipoort', coordinates: [-25.4350, 31.9350], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Kriel', coordinates: [-26.2550, 29.2350], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Laeveld', coordinates: [-25.4750, 30.9750], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Lydenburg', coordinates: [-25.0950, 30.4550], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Malelane', coordinates: [-25.4833, 31.5167], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Marble Hall', coordinates: [-24.9667, 29.2833], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Middelburg', coordinates: [-25.7750, 29.4650], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Middelburg-Noord', coordinates: [-25.7550, 29.4750], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Nelspruit', coordinates: [-25.4753, 30.9694], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Ogies', coordinates: [-26.0450, 29.0550], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Phalaborwa', coordinates: [-23.9428, 31.1411], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Secunda', coordinates: [-26.5167, 29.1667], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Standerton', coordinates: [-26.9333, 29.2500], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Suidoos-Witbank', coordinates: [-25.8950, 29.2550], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Sundra', coordinates: [-26.1350, 28.8350], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Trichardtsfontein', coordinates: [-26.5050, 29.1350], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Volksrust', coordinates: [-27.3667, 29.8833], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Waterval Boven', coordinates: [-25.6450, 30.3550], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Witbank-Noord', coordinates: [-25.8550, 29.2150], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },
  { naam: 'Witbank-Suid', coordinates: [-25.8850, 29.2250], provinsie: 'Mpumalanga', land: 'Suid-Afrika' },

  // Limpopo
  { naam: 'Letsitele', coordinates: [-23.8750, 30.3350], provinsie: 'Limpopo', land: 'Suid-Afrika' },
  { naam: 'Louis Trichardt', coordinates: [-23.0444, 29.9050], provinsie: 'Limpopo', land: 'Suid-Afrika' },
  { naam: 'Messina', coordinates: [-22.3550, 30.0450], provinsie: 'Limpopo', land: 'Suid-Afrika' },
  { naam: 'Naboomsprui', coordinates: [-24.5550, 28.7450], provinsie: 'Limpopo', land: 'Suid-Afrika' },
  { naam: 'Naboomspruit', coordinates: [-24.5550, 28.7450], provinsie: 'Limpopo', land: 'Suid-Afrika' },
  { naam: 'Potgietersrus', coordinates: [-24.1833, 29.0167], provinsie: 'Limpopo', land: 'Suid-Afrika' },
  { naam: 'Roedtan', coordinates: [-24.6750, 28.8950], provinsie: 'Limpopo', land: 'Suid-Afrika' },
  { naam: 'Tzaneen', coordinates: [-23.8333, 30.1667], provinsie: 'Limpopo', land: 'Suid-Afrika' },
  { naam: 'Warmbad', coordinates: [-24.8833, 28.2833], provinsie: 'Limpopo', land: 'Suid-Afrika' },
  { naam: 'Waterberg', coordinates: [-24.2550, 28.0550], provinsie: 'Limpopo', land: 'Suid-Afrika' },
  { naam: 'Welgelegen-Pietersburg', coordinates: [-23.9050, 29.4650], provinsie: 'Limpopo', land: 'Suid-Afrika' },

  // North West
  { naam: 'Brits', coordinates: [-25.6350, 27.7800], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Christiana', coordinates: [-27.9167, 25.1667], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Delareyville', coordinates: [-26.6833, 25.4500], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Groot Marico', coordinates: [-25.5167, 26.4167], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Hartebeeshoek', coordinates: [-25.8850, 27.7050], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Hartebeestpoort', coordinates: [-25.7450, 27.8650], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Klerksdorp-Doringkruin', coordinates: [-26.8550, 26.6350], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Klerksdorp-Oos', coordinates: [-26.8650, 26.6650], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Klerksdorp-Suid', coordinates: [-26.8850, 26.6450], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Klerksdorp-Wilkoppies', coordinates: [-26.8450, 26.6250], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Klerksdorp/emeritaat', coordinates: [-26.8667, 26.6500], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Koster', coordinates: [-25.8667, 26.9000], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Leeudoringstad', coordinates: [-27.5833, 26.0333], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Lichtenburg', coordinates: [-26.1500, 26.1667], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Lichtenburg-Oos', coordinates: [-26.1350, 26.1950], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Mafeking', coordinates: [-25.8650, 25.6350], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Magaliesburg', coordinates: [-25.9833, 27.5500], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Magaliesmoot', coordinates: [-25.9550, 27.5250], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Ottosdal', coordinates: [-26.8000, 25.9667], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Potchefstroom', coordinates: [-26.7145, 27.0970], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Potchefstroom-Noord', coordinates: [-26.6950, 27.0850], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Potchefstroom-Suid', coordinates: [-26.7350, 27.1050], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Rustenburg-Kloof', coordinates: [-25.6550, 27.2350], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Rustenburg-Suid', coordinates: [-25.6850, 27.2450], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Rustenburg-Tuine', coordinates: [-25.6650, 27.2550], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Stilfontein-Wes', coordinates: [-26.8350, 26.7650], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Ventersdorp', coordinates: [-26.3167, 26.8167], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Wolmaransstad', coordinates: [-27.1833, 25.9667], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Zwartruggens', coordinates: [-25.7333, 26.6500], provinsie: 'Noordwes', land: 'Suid-Afrika' },

  // Free State
  { naam: 'Balfour', coordinates: [-26.6667, 28.5833], provinsie: 'Vrystaat', land: 'Suid-Afrika' },
  { naam: 'Bethlehem', coordinates: [-28.2306, 28.3078], provinsie: 'Vrystaat', land: 'Suid-Afrika' },
  { naam: 'Bloemfontein', coordinates: [-29.0852, 26.1596], provinsie: 'Vrystaat', land: 'Suid-Afrika' },
  { naam: 'Bloemfontein-Wes', coordinates: [-29.0950, 26.1350], provinsie: 'Vrystaat', land: 'Suid-Afrika' },
  { naam: 'Bothaville', coordinates: [-27.3833, 26.6167], provinsie: 'Vrystaat', land: 'Suid-Afrika' },
  { naam: 'Odendaalsrus', coordinates: [-27.8667, 26.6833], provinsie: 'Vrystaat', land: 'Suid-Afrika' },
  { naam: 'Parys', coordinates: [-26.9000, 27.4500], provinsie: 'Vrystaat', land: 'Suid-Afrika' },
  { naam: 'Vaalharts', coordinates: [-27.9550, 24.8350], provinsie: 'Vrystaat', land: 'Suid-Afrika' },
  { naam: 'Viljoenskroon', coordinates: [-27.2000, 26.9500], provinsie: 'Vrystaat', land: 'Suid-Afrika' },
  { naam: 'Villiers/emeritaat', coordinates: [-27.0333, 28.6000], provinsie: 'Vrystaat', land: 'Suid-Afrika' },

  // KwaZulu-Natal
  { naam: 'Glencoe', coordinates: [-28.1667, 30.1500], provinsie: 'KwaZulu-Natal', land: 'Suid-Afrika' },
  { naam: 'Newcastle', coordinates: [-27.7575, 29.9319], provinsie: 'KwaZulu-Natal', land: 'Suid-Afrika' },
  { naam: 'Pietermaritzburg', coordinates: [-29.6006, 30.3794], provinsie: 'KwaZulu-Natal', land: 'Suid-Afrika' },
  { naam: 'Pinetown', coordinates: [-29.8167, 30.8667], provinsie: 'KwaZulu-Natal', land: 'Suid-Afrika' },
  { naam: 'Vryheid', coordinates: [-27.7667, 30.7833], provinsie: 'KwaZulu-Natal', land: 'Suid-Afrika' },
  { naam: 'Laer Suidkus', coordinates: [-30.8550, 30.3250], provinsie: 'KwaZulu-Natal', land: 'Suid-Afrika' },

  // Northern Cape
  { naam: 'Kathu', coordinates: [-27.6944, 23.0458], provinsie: 'Noord-Kaap', land: 'Suid-Afrika' },
  { naam: 'Postmasburg', coordinates: [-28.3333, 23.0667], provinsie: 'Noord-Kaap', land: 'Suid-Afrika' },
  { naam: 'Vanderkloof', coordinates: [-29.9950, 24.7350], provinsie: 'Noord-Kaap', land: 'Suid-Afrika' },

  // Western Cape
  { naam: 'Kaapstad', coordinates: [-33.9249, 18.4241], provinsie: 'Wes-Kaap', land: 'Suid-Afrika' },
  { naam: 'Mosselbaai', coordinates: [-34.1833, 22.1333], provinsie: 'Wes-Kaap', land: 'Suid-Afrika' },
  { naam: 'Stellenbosch', coordinates: [-33.9321, 18.8602], provinsie: 'Wes-Kaap', land: 'Suid-Afrika' },
  { naam: 'Strand', coordinates: [-34.1167, 18.8333], provinsie: 'Wes-Kaap', land: 'Suid-Afrika' },
  { naam: 'Swellendam', coordinates: [-34.0167, 20.4333], provinsie: 'Wes-Kaap', land: 'Suid-Afrika' },
  { naam: 'Weskus', coordinates: [-32.9550, 17.8850], provinsie: 'Wes-Kaap', land: 'Suid-Afrika' },
  { naam: 'Worcester', coordinates: [-33.6500, 19.4500], provinsie: 'Wes-Kaap', land: 'Suid-Afrika' },
  { naam: 'Philadelphia', coordinates: [-33.6650, 18.6250], provinsie: 'Wes-Kaap', land: 'Suid-Afrika' },

  // Eastern Cape
  { naam: 'Jeffreysbaai', coordinates: [-34.0333, 24.9167], provinsie: 'Oos-Kaap', land: 'Suid-Afrika' },
  { naam: 'Oos-Londen', coordinates: [-33.0292, 27.8546], provinsie: 'Oos-Kaap', land: 'Suid-Afrika' },
  { naam: 'Outeniqua', coordinates: [-33.9550, 22.4550], provinsie: 'Oos-Kaap', land: 'Suid-Afrika' },

  // Namibia
  { naam: 'Gobabis', coordinates: [-22.4500, 18.9667], provinsie: 'Omaheke', land: 'Namibië' },
  { naam: 'Grootfontein', coordinates: [-19.5667, 18.1167], provinsie: 'Otjozondjupa', land: 'Namibië' },
  { naam: 'Namib-Suid', coordinates: [-23.5550, 15.0550], provinsie: 'Hardap', land: 'Namibië' },
  { naam: 'Namibkus', coordinates: [-22.5550, 14.5350], provinsie: 'Erongo', land: 'Namibië' },
  { naam: 'Otjiwarongo', coordinates: [-20.4633, 16.6478], provinsie: 'Otjozondjupa', land: 'Namibië' },
  { naam: 'Outjo', coordinates: [-20.1167, 16.1500], provinsie: 'Kunene', land: 'Namibië' },
  { naam: 'Windhoek', coordinates: [-22.5609, 17.0658], provinsie: 'Khomas', land: 'Namibië' },

  // Botswana
  { naam: 'Gaborone', coordinates: [-24.6282, 25.9231], provinsie: 'South-East', land: 'Botswana' },

  // Zimbabwe
  { naam: 'Harare', coordinates: [-17.8292, 31.0522], provinsie: 'Harare', land: 'Zimbabwe' },

  // Special/Administrative Gemeentes (placed in Pretoria area)
  { naam: 'ANDER', coordinates: [-25.7500, 28.2000], provinsie: 'Gauteng', land: 'Suid-Afrika', beskrywing: 'Ander Gemeentes' },
  { naam: 'Buiteland', coordinates: [-25.7600, 28.2100], provinsie: 'Gauteng', land: 'Suid-Afrika', beskrywing: 'Buitelandse Gemeentes' },
  { naam: 'Bybelgenootskap', coordinates: [-25.7700, 28.2200], provinsie: 'Gauteng', land: 'Suid-Afrika', beskrywing: 'Bybelgenootskap' },
  { naam: 'Siekte Emeritaat', coordinates: [-25.7800, 28.2300], provinsie: 'Gauteng', land: 'Suid-Afrika', beskrywing: 'Siekte Emeritaat' },
  { naam: 'Sinodaal', coordinates: [-25.7900, 28.2400], provinsie: 'Gauteng', land: 'Suid-Afrika', beskrywing: 'Sinodaal' },
  { naam: 'Môrester/dosent/emeritaat', coordinates: [-25.7550, 28.2350], provinsie: 'Gauteng', land: 'Suid-Afrika', beskrywing: 'Môrester Dosent/Emeritaat' },

  // Named after people (placed in relevant areas)
  { naam: 'Bergsig', coordinates: [-25.7350, 28.1850], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Calder', coordinates: [-26.1550, 28.0450], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Culembeeck', coordinates: [-25.7450, 28.2050], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Declercqville', coordinates: [-26.8750, 26.6150], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Deo Volente', coordinates: [-25.7650, 28.2150], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Derde Kruis', coordinates: [-25.7850, 28.2250], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Dippenaar', coordinates: [-25.7250, 28.1950], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Ebenhaeset', coordinates: [-25.7150, 28.2050], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Eendracht', coordinates: [-25.7050, 28.1850], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'El-Flora', coordinates: [-26.2150, 28.1550], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Emmaus Kenleaf', coordinates: [-26.1250, 28.2350], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Fourie', coordinates: [-25.7350, 28.2450], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Gerdau', coordinates: [-25.7450, 28.2550], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Goudveld', coordinates: [-26.8550, 26.6750], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Grimbeekpark', coordinates: [-26.7050, 27.1150], provinsie: 'Noordwes', land: 'Suid-Afrika' },
  { naam: 'Groeneweide', coordinates: [-25.7550, 28.2650], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Horn', coordinates: [-25.7650, 28.2750], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Jansen', coordinates: [-25.7750, 28.2850], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Joachim Prinsloo', coordinates: [-25.7850, 28.2950], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Jordaan', coordinates: [-25.7950, 28.3050], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Koodoesrand', coordinates: [-25.8050, 28.1650], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Kruin', coordinates: [-25.7350, 28.2750], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Kruispad', coordinates: [-25.7450, 28.2850], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Losberg', coordinates: [-25.7550, 28.2950], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Makarios', coordinates: [-25.7650, 28.3050], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Nel', coordinates: [-25.7750, 28.3150], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Niemann', coordinates: [-25.7850, 28.3250], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Onverwacht', coordinates: [-25.7950, 28.3350], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Oosthuizen', coordinates: [-25.8050, 28.3450], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Panorama', coordinates: [-25.8150, 28.3550], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Pierneef', coordinates: [-25.7250, 28.2150], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Piet Potgieter', coordinates: [-25.7350, 28.2250], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Pieterse', coordinates: [-25.7450, 28.2350], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Rensburg', coordinates: [-25.7550, 28.2450], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Rietvallei', coordinates: [-25.7650, 28.2550], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Riviere', coordinates: [-25.7750, 28.2650], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Robberts', coordinates: [-25.7850, 28.2750], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Rossouw-Lombard', coordinates: [-25.7950, 28.2850], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Ruskoppies', coordinates: [-25.8050, 28.2950], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Schoemansdal', coordinates: [-23.0550, 29.9150], provinsie: 'Limpopo', land: 'Suid-Afrika' },
  { naam: 'Sionspoort', coordinates: [-25.8150, 28.3050], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Van Der Hoff', coordinates: [-25.7350, 28.2350], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Van Warmelo', coordinates: [-25.7450, 28.2450], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Vliegepoort', coordinates: [-25.7550, 28.2550], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Weltevrede', coordinates: [-25.7650, 28.2650], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Witfontein', coordinates: [-25.7750, 28.2750], provinsie: 'Gauteng', land: 'Suid-Afrika' },
  { naam: 'Zesfontein', coordinates: [-25.7850, 28.2850], provinsie: 'Gauteng', land: 'Suid-Afrika' },
];

// Get location by gemeente name
export const getGemeenteLocation = (naam: string): GemeenteLocation | undefined => {
  return GEMEENTE_LOCATIONS.find(loc => loc.naam.toLowerCase() === naam.toLowerCase());
};

// Get all locations for a specific province
export const getLocationsByProvince = (provinsie: string): GemeenteLocation[] => {
  return GEMEENTE_LOCATIONS.filter(loc => loc.provinsie === provinsie);
};

// Get all locations for a specific country
export const getLocationsByCountry = (land: string): GemeenteLocation[] => {
  return GEMEENTE_LOCATIONS.filter(loc => loc.land === land);
};

// Get unique provinces
export const getUniqueProvinces = (): string[] => {
  return [...new Set(GEMEENTE_LOCATIONS.map(loc => loc.provinsie))].sort();
};

// Get unique countries
export const getUniqueCountries = (): string[] => {
  return [...new Set(GEMEENTE_LOCATIONS.map(loc => loc.land))].sort();
};
