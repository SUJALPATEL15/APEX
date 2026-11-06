import React, { useState, useEffect, useRef, useMemo } from "react";
import PlayerHistoryChart from "./PlayerHistoryChart.jsx";
import AddPlayerModal from "./AddPlayerModal.jsx";
import DailyDataEntry from "./DailyDataEntry.jsx";

// ============================================================================
// APEX — Athlete Performance & eXposure Analytics
// High-Craft Synthesis: F1-75 Cockpit + Modern Bento Grid & Floating Glassmorphism
// Strict Sports Science Terminology (ACWR, sRPE) & FastAPI Contract Integration
// ============================================================================

// Full 40-athlete roster matching the APEX machine learning dataset & photos/ directory
const ALL_ATHLETES = [
  // FOOTBALL (20 Athletes)
  {
    id: "bellingham",
    fullName: "Jude Bellingham",
    name: "Jude",
    surname: "Bellingham",
    number: "05",
    sport: "Football",
    position: "Midfielder",
    club: "Real Madrid C.F.",
    country: "England",
    countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    venue: "Santiago Bernabéu",
    defaultLoads: {
      session_type: "Training",
      session_duration: 50,
      total_distance: 7500,
      high_speed_running: 500,
      accelerations_decelerations: 35,
      srpe: 4.0,
      sleep_hours: 9.5,
      soreness_score: 1,
      hrv_ms: 65,
      acute_load: 3000,
      chronic_load: 2900,
    },
  },
  {
    id: "haaland",
    fullName: "Erling Haaland",
    name: "Erling",
    surname: "Haaland",
    number: "09",
    sport: "Football",
    position: "Forward",
    club: "Manchester City",
    country: "Norway",
    countryFlag: "🇳🇴",
    venue: "Etihad Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 95,
      total_distance: 10400,
      high_speed_running: 1150,
      accelerations_decelerations: 64,
      srpe: 8.5,
      sleep_hours: 8.0,
      soreness_score: 3,
      hrv_ms: 62,
      acute_load: 3700,
      chronic_load: 2900,
    },
  },
  {
    id: "messi",
    fullName: "Lionel Messi",
    name: "Lionel",
    surname: "Messi",
    number: "10",
    sport: "Football",
    position: "Forward",
    club: "Inter Miami CF",
    country: "Argentina",
    countryFlag: "🇦🇷",
    venue: "Chase Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 90,
      total_distance: 8200,
      high_speed_running: 580,
      accelerations_decelerations: 52,
      srpe: 7.5,
      sleep_hours: 8.2,
      soreness_score: 2,
      hrv_ms: 72,
      acute_load: 3100,
      chronic_load: 2750,
    },
  },
  {
    id: "ronaldo",
    fullName: "Cristiano Ronaldo",
    name: "Cristiano",
    surname: "Ronaldo",
    number: "07",
    sport: "Football",
    position: "Forward",
    club: "Al-Nassr FC",
    country: "Portugal",
    countryFlag: "🇵🇹",
    venue: "Al-Awwal Park",
    defaultLoads: {
      session_type: "Match",
      session_duration: 92,
      total_distance: 8900,
      high_speed_running: 780,
      accelerations_decelerations: 58,
      srpe: 8.0,
      sleep_hours: 8.5,
      soreness_score: 3,
      hrv_ms: 66,
      acute_load: 3400,
      chronic_load: 2950,
    },
  },
  {
    id: "mbappe",
    fullName: "Kylian Mbappe",
    name: "Kylian",
    surname: "Mbappe",
    number: "09",
    sport: "Football",
    position: "Forward",
    club: "Real Madrid C.F.",
    country: "France",
    countryFlag: "🇫🇷",
    venue: "Santiago Bernabéu",
    defaultLoads: {
      session_type: "Match",
      session_duration: 95,
      total_distance: 10100,
      high_speed_running: 1220,
      accelerations_decelerations: 68,
      srpe: 8.0,
      sleep_hours: 7.8,
      soreness_score: 3,
      hrv_ms: 64,
      acute_load: 3600,
      chronic_load: 2850,
    },
  },
  {
    id: "debruyne",
    fullName: "Kevin De Bruyne",
    name: "Kevin",
    surname: "De Bruyne",
    number: "17",
    sport: "Football",
    position: "Midfielder",
    club: "Manchester City",
    country: "Belgium",
    countryFlag: "🇧🇪",
    venue: "Etihad Stadium",
    defaultLoads: {
      session_type: "Training",
      session_duration: 80,
      total_distance: 8300,
      high_speed_running: 620,
      accelerations_decelerations: 48,
      srpe: 6.5,
      sleep_hours: 8.0,
      soreness_score: 2,
      hrv_ms: 70,
      acute_load: 2900,
      chronic_load: 2700,
    },
  },
  {
    id: "salah",
    fullName: "Mohamed Salah",
    name: "Mohamed",
    surname: "Salah",
    number: "11",
    sport: "Football",
    position: "Forward",
    club: "Liverpool F.C.",
    country: "Egypt",
    countryFlag: "🇪🇬",
    venue: "Anfield",
    defaultLoads: {
      session_type: "Match",
      session_duration: 90,
      total_distance: 9800,
      high_speed_running: 940,
      accelerations_decelerations: 60,
      srpe: 8.0,
      sleep_hours: 7.6,
      soreness_score: 3,
      hrv_ms: 65,
      acute_load: 3500,
      chronic_load: 2900,
    },
  },
  {
    id: "modric",
    fullName: "Luka Modric",
    name: "Luka",
    surname: "Modric",
    number: "10",
    sport: "Football",
    position: "Midfielder",
    club: "Real Madrid C.F.",
    country: "Croatia",
    countryFlag: "🇭🇷",
    venue: "Santiago Bernabéu",
    defaultLoads: {
      session_type: "Training",
      session_duration: 75,
      total_distance: 7900,
      high_speed_running: 490,
      accelerations_decelerations: 42,
      srpe: 6.0,
      sleep_hours: 8.2,
      soreness_score: 2,
      hrv_ms: 74,
      acute_load: 2800,
      chronic_load: 2650,
    },
  },
  {
    id: "saka",
    fullName: "Bukayo Saka",
    name: "Bukayo",
    surname: "Saka",
    number: "07",
    sport: "Football",
    position: "Forward",
    club: "Arsenal F.C.",
    country: "England",
    countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    venue: "Emirates Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 90,
      total_distance: 10200,
      high_speed_running: 980,
      accelerations_decelerations: 66,
      srpe: 8.5,
      sleep_hours: 7.5,
      soreness_score: 3,
      hrv_ms: 63,
      acute_load: 3600,
      chronic_load: 2800,
    },
  },
  {
    id: "rice",
    fullName: "Declan Rice",
    name: "Declan",
    surname: "Rice",
    number: "41",
    sport: "Football",
    position: "Midfielder",
    club: "Arsenal F.C.",
    country: "England",
    countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    venue: "Emirates Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 95,
      total_distance: 11600,
      high_speed_running: 740,
      accelerations_decelerations: 62,
      srpe: 8.5,
      sleep_hours: 7.8,
      soreness_score: 3,
      hrv_ms: 66,
      acute_load: 3800,
      chronic_load: 3100,
    },
  },
  {
    id: "kane",
    fullName: "Harry Kane",
    name: "Harry",
    surname: "Kane",
    number: "09",
    sport: "Football",
    position: "Forward",
    club: "Bayern Munich",
    country: "England",
    countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    venue: "Allianz Arena",
    defaultLoads: {
      session_type: "Match",
      session_duration: 90,
      total_distance: 9600,
      high_speed_running: 710,
      accelerations_decelerations: 55,
      srpe: 8.0,
      sleep_hours: 8.0,
      soreness_score: 3,
      hrv_ms: 67,
      acute_load: 3400,
      chronic_load: 2850,
    },
  },
  {
    id: "courtois",
    fullName: "Thibaut Courtois",
    name: "Thibaut",
    surname: "Courtois",
    number: "01",
    sport: "Football",
    position: "Goalkeeper",
    club: "Real Madrid C.F.",
    country: "Belgium",
    countryFlag: "🇧🇪",
    venue: "Santiago Bernabéu",
    defaultLoads: {
      session_type: "Training",
      session_duration: 70,
      total_distance: 4200,
      high_speed_running: 150,
      accelerations_decelerations: 30,
      srpe: 5.5,
      sleep_hours: 8.5,
      soreness_score: 2,
      hrv_ms: 78,
      acute_load: 2200,
      chronic_load: 2300,
    },
  },
  {
    id: "alisson",
    fullName: "Alisson Becker",
    name: "Alisson",
    surname: "Becker",
    number: "01",
    sport: "Football",
    position: "Goalkeeper",
    club: "Liverpool F.C.",
    country: "Brazil",
    countryFlag: "🇧🇷",
    venue: "Anfield",
    defaultLoads: {
      session_type: "Training",
      session_duration: 70,
      total_distance: 4300,
      high_speed_running: 160,
      accelerations_decelerations: 32,
      srpe: 5.5,
      sleep_hours: 8.0,
      soreness_score: 2,
      hrv_ms: 76,
      acute_load: 2250,
      chronic_load: 2350,
    },
  },
  {
    id: "vandijk",
    fullName: "Virgil van Dijk",
    name: "Virgil",
    surname: "van Dijk",
    number: "04",
    sport: "Football",
    position: "Defender",
    club: "Liverpool F.C.",
    country: "Netherlands",
    countryFlag: "🇳🇱",
    venue: "Anfield",
    defaultLoads: {
      session_type: "Match",
      session_duration: 95,
      total_distance: 9800,
      high_speed_running: 680,
      accelerations_decelerations: 54,
      srpe: 7.5,
      sleep_hours: 8.1,
      soreness_score: 2,
      hrv_ms: 71,
      acute_load: 3200,
      chronic_load: 2900,
    },
  },
  {
    id: "dias",
    fullName: "Ruben Dias",
    name: "Ruben",
    surname: "Dias",
    number: "03",
    sport: "Football",
    position: "Defender",
    club: "Manchester City",
    country: "Portugal",
    countryFlag: "🇵🇹",
    venue: "Etihad Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 92,
      total_distance: 9700,
      high_speed_running: 640,
      accelerations_decelerations: 52,
      srpe: 7.5,
      sleep_hours: 7.9,
      soreness_score: 2,
      hrv_ms: 70,
      acute_load: 3150,
      chronic_load: 2850,
    },
  },
  {
    id: "hakimi",
    fullName: "Achraf Hakimi",
    name: "Achraf",
    surname: "Hakimi",
    number: "02",
    sport: "Football",
    position: "Defender",
    club: "Paris Saint-Germain",
    country: "Morocco",
    countryFlag: "🇲🇦",
    venue: "Parc des Princes",
    defaultLoads: {
      session_type: "Match",
      session_duration: 92,
      total_distance: 10800,
      high_speed_running: 1100,
      accelerations_decelerations: 66,
      srpe: 8.5,
      sleep_hours: 7.5,
      soreness_score: 3,
      hrv_ms: 64,
      acute_load: 3650,
      chronic_load: 2950,
    },
  },
  {
    id: "son",
    fullName: "Son Heung-min",
    name: "Heung-min",
    surname: "Son",
    number: "07",
    sport: "Football",
    position: "Forward",
    club: "Tottenham Hotspur",
    country: "South Korea",
    countryFlag: "🇰🇷",
    venue: "Tottenham Hotspur Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 90,
      total_distance: 10300,
      high_speed_running: 1040,
      accelerations_decelerations: 64,
      srpe: 8.0,
      sleep_hours: 7.8,
      soreness_score: 3,
      hrv_ms: 65,
      acute_load: 3550,
      chronic_load: 2900,
    },
  },
  {
    id: "rodri",
    fullName: "Rodri",
    name: "Rodrigo",
    surname: "Hernández (Rodri)",
    number: "16",
    sport: "Football",
    position: "Midfielder",
    club: "Manchester City",
    country: "Spain",
    countryFlag: "🇪🇸",
    venue: "Etihad Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 95,
      total_distance: 11800,
      high_speed_running: 690,
      accelerations_decelerations: 60,
      srpe: 8.5,
      sleep_hours: 8.0,
      soreness_score: 3,
      hrv_ms: 68,
      acute_load: 3750,
      chronic_load: 3100,
    },
  },
  {
    id: "vinicius",
    fullName: "Vinicius Junior",
    name: "Vinicius",
    surname: "Junior",
    number: "07",
    sport: "Football",
    position: "Forward",
    club: "Real Madrid C.F.",
    country: "Brazil",
    countryFlag: "🇧🇷",
    venue: "Santiago Bernabéu",
    defaultLoads: {
      session_type: "Match",
      session_duration: 92,
      total_distance: 10000,
      high_speed_running: 1180,
      accelerations_decelerations: 70,
      srpe: 8.5,
      sleep_hours: 7.6,
      soreness_score: 3,
      hrv_ms: 63,
      acute_load: 3650,
      chronic_load: 2880,
    },
  },
  {
    id: "arnold",
    fullName: "Trent Alexander-Arnold",
    name: "Trent",
    surname: "Alexander-Arnold",
    number: "66",
    sport: "Football",
    position: "Defender",
    club: "Liverpool F.C.",
    country: "England",
    countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    venue: "Anfield",
    defaultLoads: {
      session_type: "Match",
      session_duration: 90,
      total_distance: 10400,
      high_speed_running: 860,
      accelerations_decelerations: 62,
      srpe: 8.0,
      sleep_hours: 7.7,
      soreness_score: 3,
      hrv_ms: 66,
      acute_load: 3500,
      chronic_load: 2950,
    },
  },

  // CRICKET (20 Athletes)
  {
    id: "kohli",
    fullName: "Virat Kohli",
    name: "Virat",
    surname: "Kohli",
    number: "18",
    sport: "Cricket",
    position: "Batter",
    club: "RCB / Team India",
    country: "India",
    countryFlag: "🇮🇳",
    venue: "M. Chinnaswamy Stadium",
    defaultLoads: {
      session_type: "Training",
      session_duration: 110,
      total_distance: 7200,
      high_speed_running: 480,
      accelerations_decelerations: 52,
      srpe: 6.5,
      sleep_hours: 8.0,
      soreness_score: 2,
      hrv_ms: 78,
      acute_load: 3100,
      chronic_load: 2950,
    },
  },
  {
    id: "bumrah",
    fullName: "Jasprit Bumrah",
    name: "Jasprit",
    surname: "Bumrah",
    number: "93",
    sport: "Cricket",
    position: "Bowler",
    club: "MI / Team India",
    country: "India",
    countryFlag: "🇮🇳",
    venue: "Wankhede Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 120,
      total_distance: 9100,
      high_speed_running: 820,
      accelerations_decelerations: 70,
      srpe: 8.5,
      sleep_hours: 7.0,
      soreness_score: 4,
      hrv_ms: 52,
      acute_load: 3900,
      chronic_load: 2700,
    },
  },
  {
    id: "rohit",
    fullName: "Rohit Sharma",
    name: "Rohit",
    surname: "Sharma",
    number: "45",
    sport: "Cricket",
    position: "Batter",
    club: "MI / Team India",
    country: "India",
    countryFlag: "🇮🇳",
    venue: "Wankhede Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 130,
      total_distance: 6500,
      high_speed_running: 380,
      accelerations_decelerations: 44,
      srpe: 6.5,
      sleep_hours: 8.0,
      soreness_score: 2,
      hrv_ms: 72,
      acute_load: 3000,
      chronic_load: 2800,
    },
  },
  {
    id: "gill",
    fullName: "Shubman Gill",
    name: "Shubman",
    surname: "Gill",
    number: "77",
    sport: "Cricket",
    position: "Batter",
    club: "GT / Team India",
    country: "India",
    countryFlag: "🇮🇳",
    venue: "Narendra Modi Stadium",
    defaultLoads: {
      session_type: "Training",
      session_duration: 105,
      total_distance: 6800,
      high_speed_running: 460,
      accelerations_decelerations: 50,
      srpe: 6.5,
      sleep_hours: 8.2,
      soreness_score: 2,
      hrv_ms: 76,
      acute_load: 3050,
      chronic_load: 2900,
    },
  },
  {
    id: "sky",
    fullName: "Suryakumar Yadav",
    name: "Suryakumar",
    surname: "Yadav",
    number: "63",
    sport: "Cricket",
    position: "Batter",
    club: "MI / Team India",
    country: "India",
    countryFlag: "🇮🇳",
    venue: "Wankhede Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 95,
      total_distance: 6100,
      high_speed_running: 440,
      accelerations_decelerations: 54,
      srpe: 7.0,
      sleep_hours: 7.8,
      soreness_score: 2,
      hrv_ms: 71,
      acute_load: 2950,
      chronic_load: 2800,
    },
  },
  {
    id: "hardik",
    fullName: "Hardik Pandya",
    name: "Hardik",
    surname: "Pandya",
    number: "33",
    sport: "Cricket",
    position: "All-rounder",
    club: "MI / Team India",
    country: "India",
    countryFlag: "🇮🇳",
    venue: "Wankhede Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 135,
      total_distance: 8800,
      high_speed_running: 720,
      accelerations_decelerations: 64,
      srpe: 8.5,
      sleep_hours: 7.2,
      soreness_score: 3,
      hrv_ms: 60,
      acute_load: 3750,
      chronic_load: 2850,
    },
  },
  {
    id: "jadeja",
    fullName: "Ravindra Jadeja",
    name: "Ravindra",
    surname: "Jadeja",
    number: "08",
    sport: "Cricket",
    position: "All-rounder",
    club: "CSK / Team India",
    country: "India",
    countryFlag: "🇮🇳",
    venue: "M. A. Chidambaram Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 140,
      total_distance: 8600,
      high_speed_running: 680,
      accelerations_decelerations: 62,
      srpe: 7.5,
      sleep_hours: 8.0,
      soreness_score: 2,
      hrv_ms: 74,
      acute_load: 3300,
      chronic_load: 3000,
    },
  },
  {
    id: "siraj",
    fullName: "Mohammed Siraj",
    name: "Mohammed",
    surname: "Siraj",
    number: "73",
    sport: "Cricket",
    position: "Bowler",
    club: "RCB / Team India",
    country: "India",
    countryFlag: "🇮🇳",
    venue: "M. Chinnaswamy Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 125,
      total_distance: 8900,
      high_speed_running: 790,
      accelerations_decelerations: 68,
      srpe: 8.5,
      sleep_hours: 7.4,
      soreness_score: 3,
      hrv_ms: 58,
      acute_load: 3700,
      chronic_load: 2800,
    },
  },
  {
    id: "kuldeep",
    fullName: "Kuldeep Yadav",
    name: "Kuldeep",
    surname: "Yadav",
    number: "23",
    sport: "Cricket",
    position: "Bowler",
    club: "DC / Team India",
    country: "India",
    countryFlag: "🇮🇳",
    venue: "Arun Jaitley Stadium",
    defaultLoads: {
      session_type: "Training",
      session_duration: 90,
      total_distance: 6200,
      high_speed_running: 320,
      accelerations_decelerations: 38,
      srpe: 6.0,
      sleep_hours: 8.0,
      soreness_score: 2,
      hrv_ms: 73,
      acute_load: 2750,
      chronic_load: 2600,
    },
  },
  {
    id: "klrahul",
    fullName: "KL Rahul",
    name: "KL",
    surname: "Rahul",
    number: "01",
    sport: "Cricket",
    position: "Wicketkeeper-Batter",
    club: "LSG / Team India",
    country: "India",
    countryFlag: "🇮🇳",
    venue: "BRSABV Ekana Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 130,
      total_distance: 7400,
      high_speed_running: 510,
      accelerations_decelerations: 58,
      srpe: 7.5,
      sleep_hours: 7.6,
      soreness_score: 3,
      hrv_ms: 66,
      acute_load: 3350,
      chronic_load: 2900,
    },
  },
  {
    id: "arshdeep",
    fullName: "Arshdeep Singh",
    name: "Arshdeep",
    surname: "Singh",
    number: "02",
    sport: "Cricket",
    position: "Bowler",
    club: "PBKS / Team India",
    country: "India",
    countryFlag: "🇮🇳",
    venue: "PCA Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 115,
      total_distance: 8500,
      high_speed_running: 760,
      accelerations_decelerations: 64,
      srpe: 8.0,
      sleep_hours: 7.5,
      soreness_score: 3,
      hrv_ms: 61,
      acute_load: 3550,
      chronic_load: 2800,
    },
  },
  {
    id: "axar",
    fullName: "Axar Patel",
    name: "Axar",
    surname: "Patel",
    number: "20",
    sport: "Cricket",
    position: "All-rounder",
    club: "DC / Team India",
    country: "India",
    countryFlag: "🇮🇳",
    venue: "Arun Jaitley Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 120,
      total_distance: 7800,
      high_speed_running: 580,
      accelerations_decelerations: 54,
      srpe: 7.0,
      sleep_hours: 8.0,
      soreness_score: 2,
      hrv_ms: 71,
      acute_load: 3100,
      chronic_load: 2850,
    },
  },
  {
    id: "pant",
    fullName: "Rishabh Pant",
    name: "Rishabh",
    surname: "Pant",
    number: "17",
    sport: "Cricket",
    position: "Wicketkeeper-Batter",
    club: "DC / Team India",
    country: "India",
    countryFlag: "🇮🇳",
    venue: "Arun Jaitley Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 135,
      total_distance: 7600,
      high_speed_running: 530,
      accelerations_decelerations: 62,
      srpe: 8.0,
      sleep_hours: 7.5,
      soreness_score: 3,
      hrv_ms: 64,
      acute_load: 3450,
      chronic_load: 2900,
    },
  },
  {
    id: "iyer",
    fullName: "Shreyas Iyer",
    name: "Shreyas",
    surname: "Iyer",
    number: "96",
    sport: "Cricket",
    position: "Batter",
    club: "KKR / Team India",
    country: "India",
    countryFlag: "🇮🇳",
    venue: "Eden Gardens",
    defaultLoads: {
      session_type: "Training",
      session_duration: 100,
      total_distance: 6600,
      high_speed_running: 430,
      accelerations_decelerations: 48,
      srpe: 6.5,
      sleep_hours: 8.0,
      soreness_score: 2,
      hrv_ms: 73,
      acute_load: 3000,
      chronic_load: 2800,
    },
  },
  {
    id: "jaiswal",
    fullName: "Yashasvi Jaiswal",
    name: "Yashasvi",
    surname: "Jaiswal",
    number: "64",
    sport: "Cricket",
    position: "Batter",
    club: "RR / Team India",
    country: "India",
    countryFlag: "🇮🇳",
    venue: "Sawai Mansingh Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 110,
      total_distance: 7100,
      high_speed_running: 520,
      accelerations_decelerations: 55,
      srpe: 7.0,
      sleep_hours: 8.1,
      soreness_score: 2,
      hrv_ms: 75,
      acute_load: 3150,
      chronic_load: 2900,
    },
  },
  {
    id: "cummins",
    fullName: "Pat Cummins",
    name: "Pat",
    surname: "Cummins",
    number: "30",
    sport: "Cricket",
    position: "Bowler",
    club: "SRH / Australia",
    country: "Australia",
    countryFlag: "🇦🇺",
    venue: "Rajiv Gandhi Stadium",
    defaultLoads: {
      session_type: "Match",
      session_duration: 130,
      total_distance: 9200,
      high_speed_running: 810,
      accelerations_decelerations: 70,
      srpe: 8.5,
      sleep_hours: 7.2,
      soreness_score: 3,
      hrv_ms: 59,
      acute_load: 3850,
      chronic_load: 2950,
    },
  },
  {
    id: "smith",
    fullName: "Steve Smith",
    name: "Steve",
    surname: "Smith",
    number: "49",
    sport: "Cricket",
    position: "Batter",
    club: "Team Australia",
    country: "Australia",
    countryFlag: "🇦🇺",
    venue: "Sydney Cricket Ground",
    defaultLoads: {
      session_type: "Training",
      session_duration: 115,
      total_distance: 6900,
      high_speed_running: 420,
      accelerations_decelerations: 49,
      srpe: 6.5,
      sleep_hours: 8.0,
      soreness_score: 2,
      hrv_ms: 72,
      acute_load: 3050,
      chronic_load: 2850,
    },
  },
  {
    id: "head",
    fullName: "Travis Head",
    name: "Travis",
    surname: "Head",
    number: "62",
    sport: "Cricket",
    position: "Batter",
    club: "SRH / Australia",
    country: "Australia",
    countryFlag: "🇦🇺",
    venue: "Adelaide Oval",
    defaultLoads: {
      session_type: "Match",
      session_duration: 105,
      total_distance: 7000,
      high_speed_running: 540,
      accelerations_decelerations: 56,
      srpe: 7.5,
      sleep_hours: 7.8,
      soreness_score: 2,
      hrv_ms: 69,
      acute_load: 3250,
      chronic_load: 2880,
    },
  },
  {
    id: "williamson",
    fullName: "Kane Williamson",
    name: "Kane",
    surname: "Williamson",
    number: "22",
    sport: "Cricket",
    position: "Batter",
    club: "Team New Zealand",
    country: "New Zealand",
    countryFlag: "🇳🇿",
    venue: "Basin Reserve",
    defaultLoads: {
      session_type: "Training",
      session_duration: 100,
      total_distance: 6500,
      high_speed_running: 390,
      accelerations_decelerations: 46,
      srpe: 6.0,
      sleep_hours: 8.3,
      soreness_score: 2,
      hrv_ms: 75,
      acute_load: 2900,
      chronic_load: 2800,
    },
  },
  {
    id: "buttler",
    fullName: "Jos Buttler",
    name: "Jos",
    surname: "Buttler",
    number: "63",
    sport: "Cricket",
    position: "Wicketkeeper-Batter",
    club: "RR / Team England",
    country: "England",
    countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    venue: "Lord's Cricket Ground",
    defaultLoads: {
      session_type: "Match",
      session_duration: 125,
      total_distance: 7500,
      high_speed_running: 560,
      accelerations_decelerations: 60,
      srpe: 8.0,
      sleep_hours: 7.7,
      soreness_score: 3,
      hrv_ms: 65,
      acute_load: 3400,
      chronic_load: 2900,
    },
  },
];

const SPORT_POSITIONS = {
  Football: ["Midfielder", "Forward", "Defender", "Goalkeeper"],
  Cricket: ["Batter", "All-rounder", "Bowler", "Wicketkeeper-Batter"],
};

const SESSION_TYPES = ["Training", "Match", "Recovery", "Rest", "Taper"];

const ELITE_ORGS = [
  "Real Madrid C.F.",
  "Manchester City",
  "Liverpool F.C.",
  "Arsenal F.C.",
  "Bayern Munich",
  "Team India (BCCI)",
  "Cricket Australia",
  "Paris Saint-Germain",
  "FC Barcelona",
  "Team England (ECB)",
];

// High-craft inline SVG athlete silhouette fallback (Pure dark zinc & emerald accents)
function AthleteSilhouette({ number, name }) {
  return (
    <div className="relative w-full h-full flex items-end justify-center select-none pointer-events-none">
      <div className="absolute bottom-10 w-[460px] h-[460px] rounded-full bg-gradient-to-t from-zinc-800/35 via-zinc-900/20 to-transparent blur-[100px]" />
      <svg
        className="w-[90%] max-w-[620px] h-[85vh] max-h-[820px] text-zinc-900 transition-all duration-700 filter drop-shadow-[0_20px_60px_rgba(0,0,0,0.98)]"
        viewBox="0 0 500 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="jerseyGrad" x1="250" y1="200" x2="250" y2="700" gradientUnits="userSpaceOnUse">
            <stop stopColor="#18181b" />
            <stop offset="0.3" stopColor="#27272a" />
            <stop offset="0.7" stopColor="#18181b" />
            <stop offset="1" stopColor="#09090b" />
          </linearGradient>
          <linearGradient id="rimLight" x1="0" y1="0" x2="500" y2="700" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="0.5" stopColor="#71717a" stopOpacity="0.3" />
            <stop offset="1" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="skinGrad" x1="250" y1="50" x2="250" y2="200" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3f3f46" />
            <stop offset="1" stopColor="#18181b" />
          </linearGradient>
        </defs>

        <path
          d="M 160,210 C 130,220 80,260 60,340 C 40,420 50,560 50,700 L 450,700 C 450,560 460,420 440,340 C 420,260 370,220 340,210 C 310,240 190,240 160,210 Z"
          fill="url(#jerseyGrad)"
          stroke="url(#rimLight)"
          strokeWidth="2.5"
        />
        <path d="M 210,160 L 210,225 C 230,235 270,235 290,225 L 290,160 Z" fill="url(#skinGrad)" />
        <path
          d="M 250,55 C 205,55 195,95 195,130 C 195,165 215,190 250,190 C 285,190 305,165 305,130 C 305,95 295,55 250,55 Z"
          fill="url(#skinGrad)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
        />
        <path d="M 200,218 Q 250,260 300,218" stroke="#10b981" strokeWidth="3" strokeLinecap="round" fill="none" />
        <text x="250" y="420" textAnchor="middle" fill="rgba(255,255,255,0.14)" fontSize="140" fontWeight="900" fontFamily="monospace" fontStyle="italic">
          {number}
        </text>
        <circle cx="250" cy="285" r="7" fill="#10b981" className="animate-pulse" />
        <circle cx="250" cy="285" r="16" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
        <text x="250" y="315" textAnchor="middle" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">
          GPS // 10Hz TELEMETRY
        </text>
        <rect x="340" y="270" width="36" height="36" rx="6" fill="#18181b" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        <path d="M 358,276 L 368,284 L 358,300 L 348,284 Z" fill="#10b981" opacity="0.8" />
        <circle cx="145" cy="288" r="16" fill="#18181b" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <text x="145" y="292" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">APX</text>
      </svg>
    </div>
  );
}

// 2-Letter ISO Country Codes matching live broadcast styling
const COUNTRY_CODES = {
  "Argentina": "AR",
  "Portugal": "PT",
  "France": "FR",
  "England": "EN",
  "Norway": "NO",
  "Belgium": "BE",
  "Egypt": "EG",
  "Croatia": "HR",
  "Brazil": "BR",
  "Germany": "DE",
  "Spain": "ES",
  "India": "IN",
  "Australia": "AU",
  "South Africa": "ZA",
  "New Zealand": "NZ",
  "Pakistan": "PK",
  "Afghanistan": "AF",
  "Netherlands": "NL",
  "Georgia": "GE",
  "Uruguay": "UY",
};

// ============================================================================
// MAIN APEX DASHBOARD COMPONENT
// ============================================================================
export default function App() {
  // Selected athlete identity
  const [selectedAthlete, setSelectedAthlete] = useState(ALL_ATHLETES[0]);
  const [imageError, setImageError] = useState(false);
  const [photoExt, setPhotoExt] = useState(".png");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sportFilter, setSportFilter] = useState("All"); // 'All' | 'Football' | 'Cricket'
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Coach Input Controls (Strictly mapped to backend API contract)
  const [sport, setSport] = useState("Football");
  const [position, setPosition] = useState("Midfielder");
  const [sessionType, setSessionType] = useState("Training");

  // External Load Sliders (Default matches Bellingham Optimal Training baseline)
  const [sessionDuration, setSessionDuration] = useState(50);
  const [totalDistance, setTotalDistance] = useState(7500);
  const [highSpeedRunning, setHighSpeedRunning] = useState(500);
  const [accelerationsDecelerations, setAccelerationsDecelerations] = useState(35);

  // Internal Load Sliders
  const [srpe, setSrpe] = useState(4.0);
  const [sleepHours, setSleepHours] = useState(9.5);
  const [sorenessScore, setSorenessScore] = useState(1);
  const [hrvMs, setHrvMs] = useState(65);

  // Historical Rolling Metrics
  const [acuteLoad, setAcuteLoad] = useState(3000);
  const [chronicLoad, setChronicLoad] = useState(2900);

  // Live Backend Predictions State (Matches new Optimal Training model output)
  const [metrics, setMetrics] = useState({
    computed_metrics: {
      daily_load: 200.0,
      acwr: 1.03,
    },
    readiness: {
      score: 65.3,
      status: "Optimal",
    },
    injury_risk: {
      probability: 5.3,
      level: "Low",
      recommendation: "Workload and recovery within the athlete's normal range.",
      drivers: [],
    },
  });

  const [apiStatus, setApiStatus] = useState("idle"); // 'idle' | 'fetching' | 'connected' | 'error'
  const [activeTab, setActiveTab] = useState("external"); // 'external' | 'internal' | 'rolling'
  const [headerNav, setHeaderNav] = useState("TELEMETRY"); // 'TELEMETRY' | 'ANALYTICS BENTO' | 'ACWR ENGINE' | 'PHYSIOLOGY'

  // Custom Players & Historical Tracking States
  const [customPlayers, setCustomPlayers] = useState([]);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [playerStatus, setPlayerStatus] = useState(null);
  const [playerHistory, setPlayerHistory] = useState([]);

  // Fetch registered players from backend on mount
  const fetchDbPlayers = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/players");
      if (res.ok) {
        const data = await res.json();
        const builtInNames = new Set(ALL_ATHLETES.map((a) => a.fullName.toLowerCase()));
        const customs = data
          .filter((p) => !builtInNames.has(p.name.toLowerCase()) && !p.player_id.startsWith("FB") && !p.player_id.startsWith("CR"))
          .map((p) => ({
            id: p.player_id,
            fullName: p.name,
            name: p.name.split(" ")[0] || p.name,
            surname: p.name.split(" ").slice(1).join(" ") || "",
            number: "00",
            sport: p.sport,
            position: p.position,
            club: "Registered Athlete",
            country: "APEX",
            countryFlag: "⚡",
            venue: "Training Complex",
            isCustom: true,
            status: p,
            defaultLoads: {
              session_type: "Training",
              session_duration: 65,
              total_distance: 7500,
              high_speed_running: 500,
              accelerations_decelerations: 35,
              srpe: 4.0,
              sleep_hours: 9.5,
              soreness_score: 1,
              hrv_ms: 65,
              acute_load: 3000,
              chronic_load: 2900,
            },
          }));
        setCustomPlayers(customs);
      }
    } catch (err) {
      console.warn("Could not fetch DB players list:", err);
    }
  };

  useEffect(() => {
    fetchDbPlayers();
  }, []);

  // Fetch status, prediction & history for custom player
  const fetchCustomPlayerData = async (playerId) => {
    try {
      setApiStatus("fetching");
      const [predRes, histRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/players/${playerId}/predict`),
        fetch(`http://127.0.0.1:8000/players/${playerId}/history?days=60`),
      ]);

      if (predRes.ok) {
        const predData = await predRes.json();
        setPlayerStatus(predData.status);
        if (predData.prediction) {
          setMetrics(predData.prediction);
        } else {
          setMetrics({
            computed_metrics: { daily_load: 0, acwr: 0 },
            readiness: { score: 0, status: "Collecting" },
            injury_risk: {
              probability: 0,
              level: "Low",
              recommendation: predData.status?.message || "Collecting data: 7 more days needed before first prediction.",
              drivers: [],
            },
          });
        }
      } else {
        setPlayerStatus({
          stage: "collecting",
          message: "Unable to retrieve athlete status from backend.",
        });
      }

      if (histRes.ok) {
        const histData = await histRes.json();
        setPlayerHistory(histData.history || []);
      }
      setApiStatus("connected");
    } catch (err) {
      console.warn("Backend offline note for custom player:", err.message);
      setApiStatus("error");
      setPlayerStatus({
        stage: "offline",
        message: "APEX backend is currently offline. Start FastAPI service (uvicorn main:app) on http://127.0.0.1:8000 to resume telemetry sync.",
      });
    }
  };

  const handlePlayerCreated = (statusData) => {
    const newAth = {
      id: statusData.player_id,
      fullName: statusData.name,
      name: statusData.name.split(" ")[0] || statusData.name,
      surname: statusData.name.split(" ").slice(1).join(" ") || "",
      number: "00",
      sport: statusData.sport,
      position: statusData.position,
      club: "Registered Athlete",
      country: "APEX",
      countryFlag: "⚡",
      venue: "Training Complex",
      isCustom: true,
      status: statusData,
      defaultLoads: {
        session_type: "Training",
        session_duration: 50,
        total_distance: 7500,
        high_speed_running: 500,
        accelerations_decelerations: 35,
        srpe: 4.0,
        sleep_hours: 9.5,
        soreness_score: 1,
        hrv_ms: 65,
        acute_load: 3000,
        chronic_load: 2900,
      },
    };
    try {
      localStorage.setItem("apex_selected_athlete_id", newAth.id);
    } catch (e) {}

    setCustomPlayers((prev) => [newAth, ...prev]);
    setSelectedAthlete(newAth);
    setPlayerStatus(statusData);
    setPlayerHistory([]);
    setMetrics({
      computed_metrics: { daily_load: 0, acwr: 0 },
      readiness: { score: 0, status: "Collecting" },
      injury_risk: {
        probability: 0,
        level: "Low",
        recommendation: statusData.message || "Collecting data: 7 more days needed before first prediction.",
        drivers: [],
      },
    });
    fetchDbPlayers();
  };

  const handleDeleteCustomPlayer = async () => {
    if (!selectedAthlete.isCustom) return;
    if (!window.confirm(`Delete athlete ${selectedAthlete.fullName}?`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/players/${selectedAthlete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        try {
          localStorage.removeItem("apex_selected_athlete_id");
        } catch (e) {}
        setCustomPlayers((prev) => prev.filter((p) => p.id !== selectedAthlete.id));
        handleSelectAthlete(ALL_ATHLETES[0]);
        fetchDbPlayers();
      }
    } catch (err) {
      console.error("Failed to delete player:", err);
    }
  };

  // Global Keyboard Command Listener (⌘K / Ctrl+K) from new ui
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered athlete results for search bar (includes registered custom players)
  const allAvailableAthletes = useMemo(() => {
    return [...customPlayers, ...ALL_ATHLETES];
  }, [customPlayers]);

  // Restore last selected athlete id from localStorage (if any)
  useEffect(() => {
    try {
      const savedId = localStorage.getItem("apex_selected_athlete_id");
      if (savedId && allAvailableAthletes.length > 0) {
        const found = allAvailableAthletes.find((a) => a.id === savedId);
        if (found && found.id !== selectedAthlete.id) {
          handleSelectAthlete(found);
        }
      }
    } catch (e) {
      console.warn("Could not read from localStorage:", e);
    }
  }, [allAvailableAthletes.length]);

  const filteredAthletes = useMemo(() => {
    return allAvailableAthletes.filter((ath) => {
      const matchesSport = sportFilter === "All" || ath.sport === sportFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        ath.fullName.toLowerCase().includes(q) ||
        ath.club.toLowerCase().includes(q) ||
        ath.position.toLowerCase().includes(q) ||
        ath.country.toLowerCase().includes(q);
      return matchesSport && matchesQuery;
    });
  }, [allAvailableAthletes, searchQuery, sportFilter]);

  // Handle switching athlete
  const handleSelectAthlete = (athlete) => {
    try {
      localStorage.setItem("apex_selected_athlete_id", athlete.id);
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }

    setSelectedAthlete(athlete);
    setSport(athlete.sport);
    setPosition(athlete.position);
    setSessionType(athlete.defaultLoads.session_type);
    setSessionDuration(athlete.defaultLoads.session_duration);
    setTotalDistance(athlete.defaultLoads.total_distance);
    setHighSpeedRunning(athlete.defaultLoads.high_speed_running);
    setAccelerationsDecelerations(athlete.defaultLoads.accelerations_decelerations);
    setSrpe(athlete.defaultLoads.srpe);
    setSleepHours(athlete.defaultLoads.sleep_hours);
    setSorenessScore(athlete.defaultLoads.soreness_score);
    setHrvMs(athlete.defaultLoads.hrv_ms);
    setAcuteLoad(athlete.defaultLoads.acute_load);
    setChronicLoad(athlete.defaultLoads.chronic_load);
    setPhotoExt(".png");
    setImageError(false);
    setIsSearchFocused(false);

    if (athlete.isCustom) {
      fetchCustomPlayerData(athlete.id);
    }
  };

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // CRITICAL BACKEND INTEGRATION: Live Predict with 300ms Debounce & AbortController
  useEffect(() => {
    // If custom athlete is selected, telemetry is driven by logged longitudinal database entries
    if (selectedAthlete.isCustom) {
      return;
    }

    setApiStatus("fetching");
    const controller = new AbortController();

    const payload = {
      sport: sport,
      position: position,
      session_type: sessionType,
      session_duration: Number(sessionDuration),
      total_distance: Number(totalDistance),
      high_speed_running: Number(highSpeedRunning),
      accelerations_decelerations: Number(accelerationsDecelerations),
      srpe: Number(srpe),
      sleep_hours: Number(sleepHours),
      soreness_score: Number(sorenessScore),
      hrv_ms: Number(hrvMs),
      acute_load: Number(acuteLoad),
      chronic_load: Number(chronicLoad),
    };

    const timer = setTimeout(async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setMetrics(data);
        setApiStatus("connected");
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("FastAPI backend note (running local resilient sports science model):", err.message);
          setApiStatus("error");

          // Resilient local sports science computation matching backend thresholds
          const derivedDaily = Number(sessionDuration) * Number(srpe);
          const derivedAcwr = chronicLoad > 0 ? Number(acuteLoad) / Number(chronicLoad) : 1.0;

          // Readiness: 70 - 4*(srpe-5) - 5*(soreness-2) + 3*(sleep-7.5) + 0.1*(hrv-65), clipped 12-95
          let score = 70 - 4 * (Number(srpe) - 5) - 5 * (Number(sorenessScore) - 2) + 3 * (Number(sleepHours) - 7.5) + 0.1 * (Number(hrvMs) - 65);
          score = Math.min(95.0, Math.max(12.0, score));

          // Injury prob: 5% base, +2% per 0.1 ACWR > 1.2 (extra above 1.5), +5% if sleep < 6.5, +4% if soreness >= 4, clipped 3-60%
          let risk = 5.0;
          if (derivedAcwr > 1.2) {
            risk += ((derivedAcwr - 1.2) / 0.1) * 2.0;
            if (derivedAcwr > 1.5) {
              risk += ((derivedAcwr - 1.5) / 0.1) * 2.0;
            }
          }
          if (Number(sleepHours) < 6.5) risk += 5.0;
          if (Number(sorenessScore) >= 4) risk += 4.0;
          risk = Math.min(60.0, Math.max(3.0, risk));

          let riskLevel = "Low";
          let recommendation = "Workload and recovery within the athlete's normal range.";
          if (derivedAcwr >= 1.5 || risk >= 15.0) {
            riskLevel = "High";
            recommendation = "High risk spike detected. Reduce contact drills and high-speed running volume.";
          } else if (derivedAcwr > 1.3 || risk >= 11.0) {
            riskLevel = "Moderate";
            recommendation = "Elevated workload. Monitor fatigue and cap high-intensity repetitions.";
          }

          const readinessStatus = score >= 65 ? "Optimal" : score >= 48 ? "Fatigued" : "Compromised";

          setMetrics({
            computed_metrics: {
              daily_load: Math.round(derivedDaily * 10) / 10,
              acwr: Math.round(derivedAcwr * 100) / 100,
            },
            readiness: {
              score: Math.round(score * 10) / 10,
              status: readinessStatus,
            },
            injury_risk: {
              probability: Math.round(risk * 10) / 10,
              level: riskLevel,
              recommendation: recommendation,
              drivers: [],
            },
          });
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    selectedAthlete.isCustom,
    sport,
    position,
    sessionType,
    sessionDuration,
    totalDistance,
    highSpeedRunning,
    accelerationsDecelerations,
    srpe,
    sleepHours,
    sorenessScore,
    hrvMs,
    acuteLoad,
    chronicLoad,
  ]);

  // Color dynamics for Readiness & Injury Risk matching new model thresholds
  const readinessStatus = metrics.readiness?.status || "Optimal";

  const isCustomCollectingOrOffline = selectedAthlete.isCustom && (playerStatus?.stage === "collecting" || playerStatus?.stage === "offline");

  const readinessColor = useMemo(() => {
    if (isCustomCollectingOrOffline) {
      return "text-zinc-500";
    }
    if (readinessStatus === "Optimal") return "text-emerald-400";
    if (readinessStatus === "Fatigued") return "text-amber-400";
    return "text-rose-500";
  }, [readinessStatus, isCustomCollectingOrOffline]);

  const readinessBadgeBg = useMemo(() => {
    if (selectedAthlete.isCustom && playerStatus?.stage === "offline") {
      return "bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm";
    }
    if (selectedAthlete.isCustom && playerStatus?.stage === "collecting") {
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
    if (readinessStatus === "Optimal") {
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm";
    }
    if (readinessStatus === "Fatigued") {
      return "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm";
    }
    return "bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm";
  }, [readinessStatus, selectedAthlete.isCustom, playerStatus?.stage]);

  const riskColor = useMemo(() => {
    if (isCustomCollectingOrOffline) {
      return "text-zinc-500";
    }
    const level = metrics.injury_risk?.level || "Low";
    if (level === "High") return "text-rose-500 drop-shadow-[0_0_35px_rgba(244,63,94,0.6)]";
    if (level === "Moderate") return "text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]";
    return "text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.5)]";
  }, [metrics.injury_risk?.level, isCustomCollectingOrOffline]);

  const riskBadgeBg = useMemo(() => {
    if (isCustomCollectingOrOffline) {
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
    const level = metrics.injury_risk?.level || "Low";
    if (level === "High") return "bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]";
    if (level === "Moderate") return "bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(251,191,36,0.3)]";
    return "bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(52,211,153,0.3)]";
  }, [metrics.injury_risk?.level, isCustomCollectingOrOffline]);

  const acwrZoneText = useMemo(() => {
    const val = metrics.computed_metrics?.acwr || 1.0;
    if (val < 0.8) return "UNDER-TRAINING";
    if (val <= 1.3) return "SWEET SPOT";
    if (val <= 1.5) return "ELEVATED FATIGUE";
    return "HIGH SPIKE ZONE";
  }, [metrics.computed_metrics?.acwr]);

  // Primary local photo URL with dynamic extension (.png primary, .jpg fallback)
  const athletePhotoSrc = `/photos/${selectedAthlete.fullName}${photoExt}`;
  const athleteCountryCode = COUNTRY_CODES[selectedAthlete.country] || selectedAthlete.country.slice(0, 2).toUpperCase();

  // Additional states for new ui sections
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navHovered, setNavHovered] = useState(null);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-zinc-800 selection:text-white relative overflow-x-hidden">
      {/* =====================================================================
          STYLES FROM NEW UI (NOISE, SHIMMER, PULSE-GLOW, MARQUEE, BORDER-BEAM)
          ===================================================================== */}
      <style>{`
        /* Noise texture overlay from new ui */
        .noise-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 999;
          opacity: 0.015;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        /* Shimmer animation for primary CTAs */
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer-btn {
          position: relative;
          overflow: hidden;
        }
        .shimmer-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }

        /* Pulse glow for status indicators */
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px currentColor; }
          50% { opacity: 0.55; box-shadow: 0 0 12px currentColor; }
        }
        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        /* Border beam light sweep for highlighted pricing card */
        @keyframes border-beam {
          0% { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }
        .border-beam {
          animation: border-beam 8s linear infinite;
        }

        /* Draw line animation for SVG curves */
        @keyframes draw-line {
          to { stroke-dashoffset: 0; }
        }
        .draw-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw-line 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Infinite marquee ticker */
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 28s linear infinite;
        }

        /* Range sliders & scrollbars */
        input[type=range] {
          -webkit-appearance: none;
          background: #18181b;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 22px;
          width: 22px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 2.5px solid #27272a;
          box-shadow: 0 0 14px rgba(255, 255, 255, 0.35);
          margin-top: -6px;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 10px;
          cursor: pointer;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>

      {/* Subtle Noise Texture Overlay from new ui */}
      <div className="noise-overlay" />

      {/* =====================================================================
          1. BACKGROUND ATMOSPHERE (PURE DARK ZINC-950 FROM NEW UI, NO RED!)
          ===================================================================== */}
      {/* Background gradient from new ui: pure neutral zinc-950 */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 pointer-events-none" />

      {/* Subtle radial glow from new ui (matching attached screenshot) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle technical grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* =====================================================================
          2. FLOATING PILL NAVBAR (MATCHING NEW UI PHOTO EXACTLY)
          ===================================================================== */}
      <header className="relative z-40 w-full pt-4 px-6 flex justify-center">
        <nav className="w-full max-w-7xl rounded-full bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/80 px-6 sm:px-8 py-3 shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex items-center justify-between min-h-[70px]">
          {/* Left: Official APEX Product Logo */}
          <div className="flex items-center gap-3.5 cursor-pointer group shrink-0">
            <div className="h-10 sm:h-11 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="APEX Logo"
                className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                75 // ML
              </span>
              <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase hidden xl:block">
                Athlete Exposure Analytics
              </span>
            </div>
          </div>

          {/* Center: Navigation Capsule Tabs - Perfectly Centered & Horizontally Balanced */}
          <div className="hidden md:flex items-center p-1 bg-zinc-900/60 rounded-full border border-zinc-800/70 shadow-inner">
            {[
              { id: "TELEMETRY", label: "TELEMETRY" },
              { id: "ANALYTICS BENTO", label: "ANALYTICS BENTO" },
              { id: "ACWR ENGINE", label: "ACWR ENGINE" },
              { id: "PHYSIOLOGY", label: "PHYSIOLOGY" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setHeaderNav(tab.id)}
                className={`h-9 sm:h-9.5 px-4 sm:px-5 rounded-full text-xs sm:text-sm font-bold tracking-wider transition-all flex items-center justify-center ${
                  headerNav === tab.id
                    ? "bg-zinc-800 text-white font-bold border border-zinc-700 shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: Search & Live Status Badge with matching vertical height & baseline */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Quick ⌘K Search trigger */}
            <button
              onClick={() => {
                setHeaderNav("TELEMETRY");
                searchInputRef.current?.focus();
                setIsSearchFocused(true);
              }}
              className="hidden lg:flex items-center gap-2 h-9 sm:h-9.5 px-4 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs sm:text-sm font-mono text-zinc-300 hover:text-white transition-all shadow-sm"
              title="Press ⌘K or Ctrl+K to search athletes"
            >
              <span>Search</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-zinc-800 border border-zinc-700 rounded text-zinc-400 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Live Status Badge */}
            <div
              className={`flex items-center gap-2.5 h-9 sm:h-9.5 px-4 rounded-full text-xs sm:text-sm font-mono font-bold border backdrop-blur-xl transition-all ${
                apiStatus === "connected"
                  ? "bg-zinc-900/90 border-zinc-800 text-zinc-200 shadow-sm"
                  : apiStatus === "fetching"
                  ? "bg-amber-950/40 border-amber-500/40 text-amber-300 animate-pulse"
                  : "bg-zinc-900/80 border-zinc-800 text-zinc-400"
              }`}
              title="FastAPI Backend: http://127.0.0.1:8000/predict"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full pulse-glow ${
                  apiStatus === "connected"
                    ? "bg-emerald-500 text-emerald-500"
                    : apiStatus === "fetching"
                    ? "bg-amber-400 text-amber-400"
                    : "bg-zinc-500 text-zinc-500"
                }`}
              />
              <span className="hidden sm:inline">
                {apiStatus === "connected" ? "LIVE // 8000" : apiStatus === "fetching" ? "SYNCING..." : "LOCAL SYNC"}
              </span>
            </div>
          </div>
        </nav>
      </header>

      {/* =====================================================================
          3. MAIN VIEW SWITCHER (TELEMETRY COCKPIT vs BENTO SUITE)
          ===================================================================== */}
      {headerNav === "TELEMETRY" ? (
        /* -----------------------------------------------------------------
           VIEW 1: ATHLETE BROADCAST COCKPIT (ENLARGED COCKPIT STACK)
           ----------------------------------------------------------------- */
        <main className="relative z-10 flex-1 flex overflow-hidden pt-3">
          {/* LEFT COLUMN: ENLARGED SEARCH, LOCATION, GPS MAP & FATIGUE METRICS STACK */}
          <div className="w-[460px] lg:w-[520px] xl:w-[560px] flex-shrink-0 h-full flex flex-col justify-between px-6 pb-6 pt-1 z-20 pointer-events-auto overflow-y-auto custom-scrollbar">
            {/* Top: Athlete Search Bar & Add Athlete button with ⌘K shortcut */}
            <div className="w-full mb-4 space-y-2.5">
              <button
                type="button"
                onClick={() => setIsAddPlayerOpen(true)}
                className="w-full py-2.5 px-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs sm:text-sm font-mono font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span className="text-emerald-400 font-black text-base leading-none">+</span>
                <span>Add Athlete</span>
              </button>

              <div ref={searchContainerRef} className="relative w-full">
                <div className="relative flex items-center">
                  <div className="absolute left-4.5 pointer-events-none text-zinc-400">
                    <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    placeholder="Search athletes (⌘K)..."
                    className="w-full bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 focus:border-zinc-500 rounded-2xl pl-14 pr-12 py-4 sm:py-4.5 text-base sm:text-lg font-medium text-white placeholder-zinc-500 outline-none transition-all shadow-xl"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 text-zinc-400 hover:text-white text-lg font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown with face avatars & NEW badge for custom players */}
                {isSearchFocused && (
                  <div className="absolute top-18 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-80 flex flex-col">
                    <div className="flex items-center gap-2 p-3 bg-zinc-950/70 border-b border-zinc-800 text-xs font-mono">
                      {["All", "Football", "Cricket"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSportFilter(s)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                            sportFilter === s ? "bg-white text-zinc-950 font-black shadow-sm" : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    <div className="overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                      {filteredAthletes.map((ath) => (
                        <button
                          key={ath.id}
                          onClick={() => handleSelectAthlete(ath)}
                          className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-all ${
                            selectedAthlete.id === ath.id
                              ? "bg-zinc-800 text-white font-bold"
                              : "hover:bg-zinc-800/60 text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 truncate">
                            {ath.isCustom ? (
                              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 shrink-0">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                              </div>
                            ) : (
                              <img
                                src={`/photos/${ath.fullName}.png`}
                                alt={ath.fullName}
                                className="w-10 h-10 rounded-full object-cover bg-zinc-800 border border-zinc-700 shrink-0"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            )}
                            <div className="truncate">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-bold block truncate">{ath.fullName}</span>
                                {ath.isCustom && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-zinc-400 block font-mono">
                                {ath.club} • #{ath.number}
                              </span>
                            </div>
                          </div>
                          <span className="text-lg ml-2">{ath.countryFlag}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BOTTOM STACK: Venue + GPS Radar Contour Directly Above Fatigue & Metrics */}
            <div className="space-y-4 sm:space-y-4.5 mt-auto">
              {/* Venue & Telemetry GPS Radar */}
              <div className="p-6 sm:p-6.5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-glow text-emerald-500" />
                    <span className="text-sm sm:text-base font-mono font-bold tracking-wider text-zinc-300 uppercase">
                      STADIUM GPS // 10Hz RADAR
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-mono text-zinc-400 font-bold">REAL-TIME</span>
                </div>

                <div className="flex items-center gap-5">
                  {/* Circular GPS radar animation with emerald pulse */}
                  <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    <div className="absolute inset-2 rounded-full border border-zinc-800" />
                    <div className="absolute inset-5 rounded-full border border-zinc-800" />
                    <div className="absolute w-3 h-3 rounded-full bg-emerald-500 pulse-glow" />
                    <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-zinc-800" />
                    <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-zinc-800" />
                  </div>

                  <div className="truncate">
                    <div className="text-xl sm:text-2xl font-black text-white truncate flex items-center gap-2">
                      <span>{selectedAthlete.venue}</span>
                    </div>
                    <div className="text-sm sm:text-base text-zinc-400 font-mono mt-1.5 truncate">
                      {selectedAthlete.club} • {selectedAthlete.country}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fatigue & Core Machine Learning Metrics Card */}
              <div className="p-6 sm:p-7 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
                  <span className="text-base sm:text-lg font-mono font-bold text-white uppercase tracking-wider">
                    BIOMETRIC LOAD & RISK SUMMARY
                  </span>
                  <span className={`text-sm sm:text-base font-mono font-black px-4 py-1.5 rounded-full border shadow-sm ${readinessBadgeBg}`}>
                    {selectedAthlete.isCustom && playerStatus?.stage === "collecting"
                      ? "COLLECTING"
                      : (metrics.readiness?.status?.toUpperCase() || "OPTIMAL")}
                  </span>
                </div>

                {/* 3 Metrics Rows */}
                <div className="grid grid-cols-3 gap-3.5 text-center">
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/85 border border-zinc-800 shadow-inner">
                    <span className="text-sm font-mono font-bold text-zinc-400 uppercase block">ACWR</span>
                    <span className="text-4xl sm:text-5xl font-black font-mono text-yellow-400 mt-1.5 block">
                      {selectedAthlete.isCustom && playerStatus?.stage === "collecting"
                        ? "--"
                        : metrics.computed_metrics?.acwr != null && !isNaN(metrics.computed_metrics.acwr)
                        ? metrics.computed_metrics.acwr.toFixed(2)
                        : "--"}
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-zinc-400 block mt-1.5 font-bold truncate">
                      {selectedAthlete.isCustom && playerStatus?.stage === "collecting" ? "COLLECTING" : acwrZoneText}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/85 border border-zinc-800 shadow-inner">
                    <span className="text-sm font-mono font-bold text-zinc-400 uppercase block">READINESS</span>
                    <span className={`text-4xl sm:text-5xl font-black font-mono mt-1.5 block ${readinessColor}`}>
                      {selectedAthlete.isCustom && playerStatus?.stage === "collecting"
                        ? "--"
                        : metrics.readiness?.score != null && !isNaN(metrics.readiness.score)
                        ? `${metrics.readiness.score.toFixed(0)}%`
                        : "--"}
                    </span>
                    <span className={`text-xs sm:text-sm font-mono block mt-1.5 font-bold truncate ${readinessColor}`}>
                      {selectedAthlete.isCustom && playerStatus?.stage === "collecting"
                        ? "Collecting data"
                        : selectedAthlete.isCustom && playerStatus?.stage === "provisional"
                        ? "LOW CONFIDENCE"
                        : metrics.readiness?.status || "Optimal"}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/85 border border-zinc-800 shadow-inner">
                    <span className="text-sm font-mono font-bold text-zinc-400 uppercase block">7D RISK</span>
                    <span className={`text-4xl sm:text-5xl font-black font-mono mt-1.5 block ${riskColor}`}>
                      {selectedAthlete.isCustom && playerStatus?.stage === "collecting"
                        ? "--"
                        : metrics.injury_risk?.probability != null && !isNaN(metrics.injury_risk.probability)
                        ? `${metrics.injury_risk.probability.toFixed(0)}%`
                        : "--"}
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-zinc-400 block mt-1.5 font-bold truncate">
                      {selectedAthlete.isCustom && playerStatus?.stage === "collecting"
                        ? "Collecting data"
                        : metrics.injury_risk?.level || "Low"}
                    </span>
                  </div>
                </div>

                {/* Clinical Protocol recommendation & Drivers */}
                <div className="pt-2 space-y-2">
                  <p className="text-sm sm:text-base font-mono text-zinc-200 leading-relaxed">
                    <span className="text-white font-black">Protocol: </span>
                    {selectedAthlete.isCustom && playerStatus?.stage === "collecting"
                      ? (playerStatus?.message || "Collecting data: more daily entries needed before the first prediction.")
                      : (metrics.injury_risk?.recommendation || "Workload within optimal physiological adaptation zone.")}
                  </p>

                  {metrics.injury_risk?.drivers && metrics.injury_risk.drivers.length > 0 && (
                    <div className="pt-1 space-y-1 font-mono text-xs">
                      <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">
                        Key Drivers:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {metrics.injury_risk.drivers.map((drv, idx) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border ${
                              drv.direction === "increases_risk"
                                ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            }`}
                          >
                            {drv.message || drv.factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CENTER STAGE: ATHLETE HERO CUTOUT & BOLD BROADCAST TYPOGRAPHY */}
          <div className="flex-1 h-full relative flex flex-col items-center justify-between pointer-events-none select-none overflow-hidden px-4 pt-1 pb-4">
            {/* Spotlight ambient halo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] bg-zinc-800/25 rounded-full blur-[140px] pointer-events-none" />

            {/* UPPER / MIDDLE AREA: ATHLETE PHOTO & ENORMOUS PERFECTLY ALIGNED JERSEY NUMBER */}
            <div className="relative flex-1 w-full min-h-0 flex items-center justify-center overflow-visible">
              {/* Giant background jersey number positioned on the left side */}
              <div className="absolute inset-y-0 left-0 sm:left-4 lg:left-8 flex items-center justify-start pointer-events-none select-none z-0">
                <span
                  className="font-black italic tracking-tighter leading-none select-none text-transparent bg-clip-text bg-gradient-to-b from-white/45 via-white/15 to-white/5 font-display"
                  style={{
                    fontSize: "clamp(280px, 30vw, 640px)",
                    lineHeight: 0.8,
                    WebkitTextStroke: "4px rgba(255, 255, 255, 0.45)",
                    textShadow: "0 0 90px rgba(255, 255, 255, 0.18)",
                  }}
                >
                  {selectedAthlete.number}
                </span>
              </div>

              {/* Athlete Photo centered directly in front of the jersey number */}
              {selectedAthlete.isCustom ? (
                <div className="relative z-10 flex items-center justify-center h-full max-h-[58vh]">
                  <AthleteSilhouette number="00" name={selectedAthlete.fullName} />
                </div>
              ) : (
                <img
                  src={athletePhotoSrc}
                  alt={selectedAthlete.fullName}
                  className="relative z-10 h-full max-h-[58vh] sm:max-h-[62vh] lg:max-h-[66vh] w-auto max-w-[90%] object-contain object-bottom drop-shadow-[0_25px_60px_rgba(0,0,0,0.98)] transition-all duration-300"
                  onError={() => {
                    if (photoExt === ".png") setPhotoExt(".jpg");
                    else setImageError(true);
                  }}
                />
              )}
              {!selectedAthlete.isCustom && imageError && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <AthleteSilhouette number={selectedAthlete.number} name={selectedAthlete.fullName} />
                </div>
              )}
            </div>

            {/* BIG PLAYER NAME & METADATA BELOW THE PHOTO (MATCHING IMAGE 1 EXACTLY) */}
            <div className="relative z-20 w-full flex flex-col items-center justify-center text-center pt-2 pb-2 pointer-events-auto select-none">
              {/* Player Name in BIG bold striking font alongside 2-letter Country Code */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black italic tracking-tight text-white uppercase font-display drop-shadow-[0_12px_40px_rgba(0,0,0,0.98)]">
                  {selectedAthlete.fullName}
                </h1>
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-normal text-zinc-300 font-mono drop-shadow ml-1 uppercase">
                  {athleteCountryCode}
                </span>
              </div>

              {/* Sub-badge strip below the big name with enlarged fonts & color accents */}
              <div className="flex items-center flex-wrap justify-center gap-3 sm:gap-4 mt-3 sm:mt-4">
                <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white text-zinc-950 font-black font-mono text-base sm:text-lg flex items-center justify-center shadow-2xl">
                  #{selectedAthlete.number}
                </span>
                <span className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-zinc-900/95 border border-zinc-800 text-sm sm:text-base font-mono font-bold text-amber-400 tracking-wider shadow-lg">
                  {selectedAthlete.position.toUpperCase()}
                </span>
                <span className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-zinc-900/95 border border-zinc-800 text-sm sm:text-base font-mono font-bold text-sky-400 shadow-lg">
                  {selectedAthlete.club}
                </span>
                <span className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-zinc-900/95 border border-zinc-800 text-sm sm:text-base font-mono font-bold text-sky-300 shadow-lg">
                  {selectedAthlete.country}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PERMANENTLY DOCKED COACH WORKLOAD CONTROLS OR CUSTOM ATHLETE ENTRY */}
          <div className="w-[390px] lg:w-[440px] xl:w-[480px] flex-shrink-0 h-full flex flex-col justify-between px-6 pb-6 pt-1 z-20 pointer-events-auto overflow-y-auto custom-scrollbar">
            {selectedAthlete.isCustom ? (
              <div className="space-y-4 pb-4">
                <DailyDataEntry
                  player={selectedAthlete}
                  status={playerStatus}
                  onEntrySaved={() => {
                    fetchCustomPlayerData(selectedAthlete.id);
                    fetchDbPlayers();
                  }}
                  onDeletePlayer={handleDeleteCustomPlayer}
                />
                <PlayerHistoryChart
                  history={playerHistory}
                  athleteName={selectedAthlete.fullName}
                />
              </div>
            ) : (
              <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5">
                {/* Controls Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">Coach Workload Controls</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Modulate training dosage parameters in real-time</p>
                  </div>

                  {/* Sub-tabs */}
                  <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-full border border-zinc-800 text-xs font-mono font-bold">
                    {["external", "internal", "rolling"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 sm:px-3.5 py-1.5 rounded-full capitalize transition-all ${
                          activeTab === tab
                            ? "bg-white text-zinc-950 font-black shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                  <button
                    onClick={() => {
                      setSessionDuration(50);
                      setTotalDistance(7500);
                      setHighSpeedRunning(500);
                      setAccelerationsDecelerations(35);
                      setSrpe(4.0);
                      setSleepHours(9.5);
                      setSorenessScore(1);
                      setHrvMs(65);
                      setAcuteLoad(3000);
                      setChronicLoad(2900);
                      setSessionType("Training");
                    }}
                    className="p-3 sm:p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-emerald-500/60 text-left transition-all shadow-sm"
                  >
                    <div className="font-bold text-white text-xs sm:text-sm">Optimal Training</div>
                    <div className="text-[10px] sm:text-xs text-emerald-400 mt-1">ACWR 1.03 // Optimal Training</div>
                  </button>

                  <button
                    onClick={() => {
                      setSessionDuration(120);
                      setTotalDistance(13500);
                      setHighSpeedRunning(1400);
                      setAccelerationsDecelerations(92);
                      setSrpe(9.5);
                      setSorenessScore(5);
                      setSleepHours(5.5);
                      setHrvMs(45);
                      setAcuteLoad(4600);
                      setChronicLoad(2600);
                      setSessionType("Match");
                    }}
                    className="p-3 sm:p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-rose-500/60 text-left transition-all shadow-sm"
                  >
                    <div className="font-bold text-rose-300 text-xs sm:text-sm">High Risk Spike</div>
                    <div className="text-[10px] sm:text-xs text-rose-400 mt-1">ACWR 1.77 // Overload Spike</div>
                  </button>
                </div>

              {/* Session Metadata Selector */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-zinc-300 font-bold block mb-1.5">Sport</label>
                    <select
                      value={sport}
                      onChange={(e) => {
                        const s = e.target.value;
                        setSport(s);
                        setPosition(SPORT_POSITIONS[s][0]);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-zinc-500 font-medium"
                    >
                      <option value="Football">Football</option>
                      <option value="Cricket">Cricket</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-zinc-300 font-bold block mb-1.5">Position</label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-zinc-500 font-medium"
                    >
                      {SPORT_POSITIONS[sport]?.map((pos) => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-zinc-300 font-bold block mb-1.5">Session Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {SESSION_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSessionType(type)}
                        className={`py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all ${
                          sessionType === type
                            ? "bg-white text-zinc-950 font-black shadow-sm"
                            : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Sliders */}
              {activeTab === "external" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-mono">
                      <span className="text-zinc-300 font-semibold">Session Duration</span>
                      <span className="text-white font-extrabold">{sessionDuration} min</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="150"
                      step="1"
                      value={sessionDuration}
                      onChange={(e) => setSessionDuration(Number(e.target.value))}
                      className="w-full h-2.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-mono">
                      <span className="text-zinc-300 font-semibold">Total Distance</span>
                      <span className="text-white font-extrabold">{totalDistance.toLocaleString()} m</span>
                    </div>
                    <input
                      type="range"
                      min="2000"
                      max="14000"
                      step="100"
                      value={totalDistance}
                      onChange={(e) => setTotalDistance(Number(e.target.value))}
                      className="w-full h-2.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-mono">
                      <span className="text-zinc-300 font-semibold">High-Speed Running</span>
                      <span className="text-white font-extrabold">{highSpeedRunning} m</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="1500"
                      step="10"
                      value={highSpeedRunning}
                      onChange={(e) => setHighSpeedRunning(Number(e.target.value))}
                      className="w-full h-2.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-mono">
                      <span className="text-zinc-300 font-semibold">Accelerations / Decelerations</span>
                      <span className="text-white font-extrabold">{accelerationsDecelerations}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={accelerationsDecelerations}
                      onChange={(e) => setAccelerationsDecelerations(Number(e.target.value))}
                      className="w-full h-2.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {activeTab === "internal" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-mono">
                      <span className="text-zinc-300 font-semibold">sRPE Effort (Borg Scale)</span>
                      <span className="text-white font-extrabold">{srpe} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={srpe}
                      onChange={(e) => setSrpe(Number(e.target.value))}
                      className="w-full h-2.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-mono">
                      <span className="text-zinc-300 font-semibold">Sleep Duration</span>
                      <span className="text-white font-extrabold">{sleepHours} hrs</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="11"
                      step="0.5"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(Number(e.target.value))}
                      className="w-full h-2.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-mono">
                      <span className="text-zinc-300 font-semibold">Muscle Soreness</span>
                      <span className="text-white font-extrabold">{sorenessScore} / 5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={sorenessScore}
                      onChange={(e) => setSorenessScore(Number(e.target.value))}
                      className="w-full h-2.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-mono">
                      <span className="text-zinc-300 font-semibold">HRV rMSSD</span>
                      <span className="text-white font-extrabold">{hrvMs} ms</span>
                    </div>
                    <input
                      type="range"
                      min="35"
                      max="115"
                      step="1"
                      value={hrvMs}
                      onChange={(e) => setHrvMs(Number(e.target.value))}
                      className="w-full h-2.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {activeTab === "rolling" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-mono">
                      <span className="text-zinc-300 font-semibold">Acute Load (7-Day Fatigue)</span>
                      <span className="text-white font-extrabold">{acuteLoad} AU</span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="6000"
                      step="50"
                      value={acuteLoad}
                      onChange={(e) => setAcuteLoad(Number(e.target.value))}
                      className="w-full h-2.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-mono">
                      <span className="text-zinc-300 font-semibold">Chronic Load (28-Day Fitness)</span>
                      <span className="text-white font-extrabold">{chronicLoad} AU</span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="5000"
                      step="50"
                      value={chronicLoad}
                      onChange={(e) => setChronicLoad(Number(e.target.value))}
                      className="w-full h-2.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Reset to athlete defaults */}
              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => handleSelectAthlete(selectedAthlete)}
                  className="text-xs sm:text-sm font-mono text-zinc-400 hover:text-white transition-colors underline"
                >
                  Reset Defaults
                </button>
              </div>
            </div>
            )}
          </div>
        </main>
      ) : (
        /* -----------------------------------------------------------------
           VIEW 2: BENTO ANALYTICS & ADVANCED SUITE (DARK ZINC-950 STYLING)
           ----------------------------------------------------------------- */
        <main className="relative z-10 flex-1 overflow-y-auto px-6 lg:px-12 py-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* View Sub-Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono font-medium text-zinc-300 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-glow text-emerald-500" />
                  <span>ATHLETE INTELLIGENCE SUITE // 2026</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                  {headerNav === "ANALYTICS BENTO" && "Bento Workload Matrix"}
                  {headerNav === "ACWR ENGINE" && "Gabbett ACWR Sweet-Spot Engine"}
                  {headerNav === "PHYSIOLOGY" && "Autonomous Nervous System & Recovery"}
                </h1>
                <p className="text-sm sm:text-base text-zinc-400 mt-2 max-w-2xl font-normal">
                  {headerNav === "ANALYTICS BENTO" &&
                    "Real-time sports science telemetry synthesized through Scikit-learn ridge regression and SMOTE random forest models."}
                  {headerNav === "ACWR ENGINE" &&
                    "Longitudinal Acute:Chronic Workload Ratio simulation preventing non-contact soft-tissue injuries."}
                  {headerNav === "PHYSIOLOGY" &&
                    "Sympathetic vs. parasympathetic tone, nocturnal HRV recovery, and subjective neuromuscular fatigue mapping."}
                </p>
              </div>

              {/* Active Athlete Quick Switch Pill */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
                  <img
                    src={athletePhotoSrc}
                    alt={selectedAthlete.fullName}
                    className="w-full h-full object-cover object-top"
                    onError={() => {
                      if (photoExt === ".png") setPhotoExt(".jpg");
                      else setImageError(true);
                    }}
                  />
                </div>
                <div className="text-left pr-2">
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    {selectedAthlete.fullName}
                    <span className="text-xs">{selectedAthlete.countryFlag}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {selectedAthlete.club} • #{selectedAthlete.number}
                  </div>
                </div>
                <button
                  onClick={() => setHeaderNav("TELEMETRY")}
                  className="shimmer-btn px-3 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-bold shadow-md active:scale-95 transition-all"
                >
                  Open Cockpit
                </button>
              </div>
            </div>

            {/* CONDITIONAL RENDER BASED ON ACTIVE NAVBAR TAB */}
            {headerNav === "ACWR ENGINE" ? (
              /* DEDICATED ACWR ENGINE VIEW */
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                        GABBETT WORKLOAD PARADOX // CLINICAL SWEET-SPOT
                      </span>
                      <h2 className="text-2xl font-bold text-white mt-1">Acute:Chronic Workload Ratio Spectrum</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black font-mono text-yellow-400">
                        {metrics.computed_metrics?.acwr?.toFixed(2) || "1.14"}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                        {acwrZoneText}
                      </span>
                    </div>
                  </div>

                  {/* Gradient Spectrum Bar with Marker */}
                  <div className="relative pt-6 pb-4">
                    <div className="h-4 w-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-400 via-amber-400 to-rose-600 shadow-inner overflow-hidden relative">
                      <div className="absolute inset-0 flex justify-between px-[20%] pointer-events-none">
                        <div className="w-0.5 h-full bg-black/40" />
                        <div className="w-0.5 h-full bg-black/40" />
                      </div>
                    </div>

                    {/* Active ACWR Needle */}
                    {(() => {
                      const val = metrics.computed_metrics?.acwr || 1.14;
                      const pct = Math.min(98, Math.max(2, (val / 2.0) * 100));
                      return (
                        <div
                          className="absolute top-2 transition-all duration-500 -translate-x-1/2 flex flex-col items-center"
                          style={{ left: `${pct}%` }}
                        >
                          <div className="px-2 py-0.5 rounded-md bg-white text-zinc-950 text-[10px] font-mono font-black shadow-lg">
                            {val.toFixed(2)}
                          </div>
                          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white mt-0.5" />
                        </div>
                      );
                    })()}

                    {/* Spectrum Zones */}
                    <div className="grid grid-cols-4 gap-2 text-center mt-4 text-[10px] sm:text-xs font-mono font-bold">
                      <div className="text-sky-400 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                        <div>&lt; 0.80</div>
                        <div className="text-[9px] text-zinc-400 mt-0.5">UNDER-TRAINING</div>
                      </div>
                      <div className="text-emerald-400 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                        <div>0.80 – 1.30</div>
                        <div className="text-[9px] text-emerald-300 mt-0.5">SWEET SPOT (SAFE)</div>
                      </div>
                      <div className="text-amber-400 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                        <div>1.30 – 1.50</div>
                        <div className="text-[9px] text-amber-300 mt-0.5">ELEVATED FATIGUE</div>
                      </div>
                      <div className="text-rose-400 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                        <div>&gt; 1.50</div>
                        <div className="text-[9px] text-rose-300 mt-0.5">HIGH INJURY SPIKE</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acute vs Chronic Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-mono font-bold text-zinc-400 uppercase">ACUTE WORKLOAD (7-DAY)</div>
                      <span className="text-2xl font-black font-mono text-white">{acuteLoad} AU</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                      Represents transient systemic fatigue accumulated over the last 7 training days.
                    </p>
                    <div className="h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-500"
                        style={{ width: `${Math.min(100, (acuteLoad / 5000) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-mono font-bold text-zinc-400 uppercase">CHRONIC WORKLOAD (28-DAY)</div>
                      <span className="text-2xl font-black font-mono text-white">{chronicLoad} AU</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                      Represents robust physical conditioning built over the preceding 28 days.
                    </p>
                    <div className="h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, (chronicLoad / 4000) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : headerNav === "PHYSIOLOGY" ? (
              /* DEDICATED PHYSIOLOGY VIEW */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
                    <div className="text-xs font-mono font-bold text-zinc-400 uppercase mb-2">AUTONOMIC TONE</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold font-mono text-white">{hrvMs}</span>
                      <span className="text-xs font-mono text-zinc-400">ms rMSSD</span>
                    </div>
                    <div className="mt-4 text-xs text-zinc-400 leading-relaxed">
                      {hrvMs >= 70
                        ? "Parasympathetic dominant. Vagal activity indicates full recovery and readiness for high strain."
                        : hrvMs >= 60
                        ? "Balanced tone. Baseline recovery profile maintained."
                        : "Sympathetic elevation detected. Indicates systemic fatigue."}
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
                    <div className="text-xs font-mono font-bold text-zinc-400 uppercase mb-2">SLEEP LOGGED</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold font-mono text-white">{sleepHours}</span>
                      <span className="text-xs font-mono text-zinc-400">hours</span>
                    </div>
                    <div className="mt-4 text-xs text-zinc-400 leading-relaxed">
                      {sleepHours >= 8.0
                        ? "Optimal cellular and hormonal restoration."
                        : sleepHours >= 7.0
                        ? "Acceptable sleep volume. Minor debt accrued."
                        : "Severe sleep restriction. Elevated cortisol risk."}
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl">
                    <div className="text-xs font-mono font-bold text-zinc-400 uppercase mb-2">NEUROMUSCULAR STRAIN</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold font-mono text-white">{sorenessScore} / 5</span>
                      <span className="text-xs font-mono text-zinc-400">DOMS rating</span>
                    </div>
                    <div className="mt-4 text-xs text-zinc-400 leading-relaxed">
                      sRPE rated at <span className="font-bold text-white">{srpe} / 10</span> on the Borg exertion scale.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* DEFAULT ANALYTICS BENTO GRID */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Bento Card 1: Monitoring */}
                <div className="md:col-span-2 group relative p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 backdrop-blur-xl shadow-xl overflow-hidden">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="p-2 rounded-lg bg-zinc-800 w-fit mb-4">
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Real-time Telemetry Stream</h3>
                      <p className="text-zinc-400 text-sm max-w-lg font-normal">
                        Continuous longitudinal monitoring stream capturing GPS kinematics, metabolic demand, and physiological load.
                      </p>
                    </div>

                    {/* Pulsing Dots Indicator */}
                    <div className="flex items-center gap-2 p-2 rounded-full bg-zinc-950/80 border border-zinc-800">
                      {[true, true, true, false, true].map((active, i) => (
                        <span
                          key={i}
                          className={`w-2 h-2 rounded-full transition-all ${
                            active ? "bg-emerald-500 pulse-glow text-emerald-500" : "bg-zinc-700"
                          }`}
                        />
                      ))}
                      <span className="text-[10px] font-mono text-zinc-400 font-bold ml-1">SYNCED</span>
                    </div>
                  </div>

                  {/* 4 Stat Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                      <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase">ACWR RATIO</div>
                      <div className="text-3xl font-black text-yellow-400 font-mono mt-1">
                        {metrics.computed_metrics?.acwr?.toFixed(2) || "1.14"}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 mt-1 font-semibold">{acwrZoneText}</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                      <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase">READINESS</div>
                      <div className="text-3xl font-black text-white font-mono mt-1">
                        {metrics.readiness?.score?.toFixed(1) || "74.2"}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400 mt-1 font-semibold">
                        {metrics.readiness?.status?.toUpperCase() || "OPTIMAL"}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                      <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase">7D INJURY RISK</div>
                      <div className={`text-3xl font-black font-mono mt-1 ${riskColor}`}>
                        {metrics.injury_risk?.probability?.toFixed(1) || "14.5"}%
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 mt-1 font-semibold">
                        {metrics.injury_risk?.level?.toUpperCase()} RISK
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                      <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase">SESSION LOAD</div>
                      <div className="text-3xl font-black text-white font-mono mt-1">
                        {metrics.computed_metrics?.daily_load || 0}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-1 font-semibold">ARBITRARY UNITS</div>
                    </div>
                  </div>
                </div>

                {/* Bento Card 2: Command Palette */}
                <div className="group relative p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 backdrop-blur-xl shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="p-2 rounded-lg bg-zinc-800 w-fit mb-4">
                      <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Command Palette</h3>
                    <p className="text-zinc-400 text-sm font-normal">
                      Jump between all 40 footballers and cricketers instantly.
                    </p>
                  </div>

                  <div className="pt-6 space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 font-mono text-xs">
                      <span className="text-zinc-400">Quick Athlete Search</span>
                      <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 shadow">⌘</kbd>
                        <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 shadow">K</kbd>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {ALL_ATHLETES.slice(0, 4).map((ath) => (
                        <button
                          key={ath.id}
                          onClick={() => handleSelectAthlete(ath)}
                          className={`p-2 rounded-xl border text-left transition-all truncate ${
                            selectedAthlete.id === ath.id
                              ? "bg-white text-zinc-950 font-bold border-white"
                              : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                          }`}
                        >
                          {ath.name} {ath.surname}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bento Card 3: Analytics Curve */}
                <div className="group relative p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 backdrop-blur-xl shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="p-2 rounded-lg bg-zinc-800 w-fit mb-4">
                      <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Workload Curve</h3>
                    <p className="text-zinc-400 text-sm font-normal">
                      28-day fatigue profile vs. safe physiological threshold.
                    </p>
                  </div>

                  <div className="pt-4">
                    <div className="relative w-full h-28 rounded-2xl bg-zinc-950/80 p-2 overflow-hidden border border-zinc-800">
                      <svg viewBox="0 0 100 60" className="w-full h-full">
                        <defs>
                          <linearGradient id="bentoGradientZinc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 0 50 L 15 42 L 30 45 L 45 28 L 60 35 L 75 20 L 90 24 L 100 12 L 100 60 L 0 60 Z"
                          fill="url(#bentoGradientZinc)"
                        />
                        <path
                          d="M 0 50 L 15 42 L 30 45 L 45 28 L 60 35 L 75 20 L 90 24 L 100 12"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          className="draw-line"
                        />
                      </svg>
                      <div className="absolute bottom-1.5 left-3 text-[10px] font-mono text-zinc-500 font-bold">
                        7D FATIGUE VS 28D FITNESS
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bento Card 4: Sub-30ms Latency */}
                <div className="group relative p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 backdrop-blur-xl shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="p-2 rounded-lg bg-zinc-800 w-fit mb-4">
                      <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Sub-30ms Latency</h3>
                    <p className="text-zinc-400 text-sm font-normal">
                      Edge-optimized FastAPI architecture delivering sub-second predictions.
                    </p>
                  </div>

                  <div className="pt-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-emerald-400 font-mono">~24ms</span>
                      <span className="text-xs text-zinc-400 font-mono">avg ML latency</span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 mt-2">
                      SMOTE RANDOM FOREST // RIDGE REGRESSOR
                    </div>
                  </div>
                </div>

                {/* Bento Card 5: Internal Physiology */}
                <div className="group relative p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 backdrop-blur-xl shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="p-2 rounded-lg bg-zinc-800 w-fit mb-4">
                      <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Internal Physiology</h3>
                    <p className="text-zinc-400 text-sm font-normal">
                      Autonomic nervous system recovery and nocturnal HRV.
                    </p>
                  </div>

                  <div className="pt-4 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">HRV rMSSD</span>
                      <span className="text-lg font-bold text-white">{hrvMs} ms</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">SLEEP</span>
                      <span className="text-lg font-bold text-white">{sleepHours} hrs</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">SORENESS</span>
                      <span className="text-lg font-bold text-white">{sorenessScore} / 5</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">sRPE EFFORT</span>
                      <span className="text-lg font-bold text-white">{srpe} / 10</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Elite Federation Marquee */}
            <div className="py-10 border-t border-zinc-800">
              <div className="text-center mb-6">
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">
                  TRUSTED ACROSS ELITE SPORTING ORGANIZATIONS & FEDERATIONS
                </p>
              </div>

              <div className="relative overflow-hidden w-full">
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

                <div className="flex animate-marquee whitespace-nowrap">
                  {[...ELITE_ORGS, ...ELITE_ORGS].map((org, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-3 px-8 py-3 mx-2 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 font-semibold text-xs uppercase tracking-wider"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                      <span>{org}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
      {/* Platform Disclaimer Footer */}
      <footer className="relative z-20 py-3.5 px-6 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur text-center">
        <p className="text-xs font-mono text-zinc-500">
          Demo uses synthetic data. Decision support only.
        </p>
      </footer>

      {/* Add Athlete Modal */}
      <AddPlayerModal
        isOpen={isAddPlayerOpen}
        onClose={() => setIsAddPlayerOpen(false)}
        onPlayerCreated={handlePlayerCreated}
      />
    </div>
  );
}
