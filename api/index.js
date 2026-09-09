// server.ts
import express from "express";
import path from "path";
import { google } from "googleapis";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// src/seedBmMap.ts
var SEED_BM_MAP = {
  "VIDYAPEETH 36-LN103MA 2026": "aarti.chalikwar@pw.live",
  "36-LN103MA 2026": "aarti.chalikwar@pw.live",
  "TUITION 36-LN103MA 2026": "aarti.chalikwar@pw.live",
  "SIP 36-LN103MA 2026": "aarti.chalikwar@pw.live",
  "LN103MA": "aarti.chalikwar@pw.live",
  "VIDYAPEETH 1H-LJ101MA 2026": "jyoti.sonawane@pw.live",
  "1H-LJ101MA 2026": "jyoti.sonawane@pw.live",
  "TUITION 1H-LJ101MA 2026": "jyoti.sonawane@pw.live",
  "SIP 1H-LJ101MA 2026": "jyoti.sonawane@pw.live",
  "LJ101MA": "prasad.shinde@pw.live",
  "VIDYAPEETH 1H-LN101MA 2026": "jyoti.sonawane@pw.live",
  "1H-LN101MA 2026": "jyoti.sonawane@pw.live",
  "TUITION 1H-LN101MA 2026": "jyoti.sonawane@pw.live",
  "SIP 1H-LN101MA 2026": "jyoti.sonawane@pw.live",
  "LN101MA": "soniya.parmar@pw.live",
  "VIDYAPEETH 51-LJ152NA 2026": "abhirathi.sarkar@pw.live",
  "51-LJ152NA 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-LJ152NA 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-LJ152NA 2026": "abhirathi.sarkar@pw.live",
  "LJ152NA": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 27-LJE51MP 2026": "aniket.mishra2@pw.live",
  "27-LJE51MP 2026": "aniket.mishra2@pw.live",
  "TUITION 27-LJE51MP 2026": "aniket.mishra2@pw.live",
  "SIP 27-LJE51MP 2026": "aniket.mishra2@pw.live",
  "LJE51MP": "aniket.mishra2@pw.live",
  "VIDYAPEETH 27-LNE51MP 2026": "aniket.mishra2@pw.live",
  "27-LNE51MP 2026": "aniket.mishra2@pw.live",
  "TUITION 27-LNE51MP 2026": "aniket.mishra2@pw.live",
  "SIP 27-LNE51MP 2026": "aniket.mishra2@pw.live",
  "LNE51MP": "aniket.mishra2@pw.live",
  "VIDYAPEETH 51-YN451NA 2026": "abhirathi.sarkar@pw.live",
  "51-YN451NA 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-YN451NA 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-YN451NA 2026": "abhirathi.sarkar@pw.live",
  "YN451NA": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 69-AJ204MA 2026": "kishor.gaikwad1@pw.live",
  "69-AJ204MA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-AJ204MA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-AJ204MA 2026": "kishor.gaikwad1@pw.live",
  "AJ204MA": "ganesh.gavhane@pw.live",
  "VIDYAPEETH 69-AN101MA 2026": "niraj.verma2@pw.live",
  "69-AN101MA 2026": "niraj.verma2@pw.live",
  "TUITION 69-AN101MA 2026": "niraj.verma2@pw.live",
  "SIP 69-AN101MA 2026": "niraj.verma2@pw.live",
  "AN101MA": "ankit.shrivastava@pw.live",
  "VIDYAPEETH 69-LJE01NA 2026": "niraj.verma2@pw.live",
  "69-LJE01NA 2026": "niraj.verma2@pw.live",
  "TUITION 69-LJE01NA 2026": "niraj.verma2@pw.live",
  "SIP 69-LJE01NA 2026": "niraj.verma2@pw.live",
  "LJE01NA": "niraj.verma2@pw.live",
  "VIDYAPEETH 69-LNE01NA 2026": "niraj.verma2@pw.live",
  "69-LNE01NA 2026": "niraj.verma2@pw.live",
  "TUITION 69-LNE01NA 2026": "niraj.verma2@pw.live",
  "SIP 69-LNE01NA 2026": "niraj.verma2@pw.live",
  "LNE01NA": "anil.polkamwar@pw.live",
  "VIDYAPEETH 69-NF201EA 2026": "kishor.gaikwad1@pw.live",
  "69-NF201EA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-NF201EA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-NF201EA 2026": "kishor.gaikwad1@pw.live",
  "NF201EA": "sagar.gaud@pw.live",
  "VIDYAPEETH 69-NF201ES 2026": "kishor.gaikwad1@pw.live",
  "69-NF201ES 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-NF201ES 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-NF201ES 2026": "kishor.gaikwad1@pw.live",
  "NF201ES": "sunita.wakle@pw.live",
  "VIDYAPEETH 69-UF101EA 2026": "kishor.gaikwad1@pw.live",
  "69-UF101EA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-UF101EA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-UF101EA 2026": "kishor.gaikwad1@pw.live",
  "UF101EA": "soniya.parmar@pw.live",
  "VIDYAPEETH 69-UF201ES 2026": "kishor.gaikwad1@pw.live",
  "69-UF201ES 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-UF201ES 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-UF201ES 2026": "kishor.gaikwad1@pw.live",
  "UF201ES": "jyoti.sonawane@pw.live",
  "VIDYAPEETH 69-UP201EA 2026": "kishor.gaikwad1@pw.live",
  "69-UP201EA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-UP201EA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-UP201EA 2026": "kishor.gaikwad1@pw.live",
  "UP201EA": "soniya.parmar@pw.live",
  "VIDYAPEETH 69-YN301MA 2026": "kishor.gaikwad1@pw.live",
  "69-YN301MA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-YN301MA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-YN301MA 2026": "kishor.gaikwad1@pw.live",
  "YN301MA": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 51-LN171NA 2026": "joyes.ashirwadam@pw.live",
  "51-LN171NA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-LN171NA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-LN171NA 2026": "joyes.ashirwadam@pw.live",
  "LN171NA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 36-AJ202MA 2026": "aarti.chalikwar@pw.live",
  "36-AJ202MA 2026": "aarti.chalikwar@pw.live",
  "TUITION 36-AJ202MA 2026": "aarti.chalikwar@pw.live",
  "SIP 36-AJ202MA 2026": "aarti.chalikwar@pw.live",
  "AJ202MA": "syed.ali3@pw.live",
  "VIDYAPEETH 36-AN202MA 2026": "ganesh.gavhane@pw.live",
  "36-AN202MA 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-AN202MA 2026": "ganesh.gavhane@pw.live",
  "SIP 36-AN202MA 2026": "ganesh.gavhane@pw.live",
  "AN202MA": "pawan.verma@pw.live",
  "VIDYAPEETH 36-LJ101NA 2026": "aarti.chalikwar@pw.live",
  "36-LJ101NA 2026": "aarti.chalikwar@pw.live",
  "TUITION 36-LJ101NA 2026": "aarti.chalikwar@pw.live",
  "SIP 36-LJ101NA 2026": "aarti.chalikwar@pw.live",
  "LJ101NA": "niraj.verma2@pw.live",
  "VIDYAPEETH 36-LN101MA 2026": "aarti.chalikwar@pw.live",
  "36-LN101MA 2026": "aarti.chalikwar@pw.live",
  "TUITION 36-LN101MA 2026": "aarti.chalikwar@pw.live",
  "SIP 36-LN101MA 2026": "aarti.chalikwar@pw.live",
  "VIDYAPEETH 36-LN102NA 2026": "ganesh.gavhane@pw.live",
  "36-LN102NA 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-LN102NA 2026": "ganesh.gavhane@pw.live",
  "SIP 36-LN102NA 2026": "ganesh.gavhane@pw.live",
  "LN102NA": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 36-NF101EA 2026": "aarti.chalikwar@pw.live",
  "36-NF101EA 2026": "aarti.chalikwar@pw.live",
  "TUITION 36-NF101EA 2026": "aarti.chalikwar@pw.live",
  "SIP 36-NF101EA 2026": "aarti.chalikwar@pw.live",
  "NF101EA": "anil.kumar8@pw.live",
  "VIDYAPEETH 36-NF201ES 2026": "ganesh.gavhane@pw.live",
  "36-NF201ES 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-NF201ES 2026": "ganesh.gavhane@pw.live",
  "SIP 36-NF201ES 2026": "ganesh.gavhane@pw.live",
  "VIDYAPEETH 36-PJ401NA 2026": "yogesh.bhalerao@pw.live",
  "36-PJ401NA 2026": "yogesh.bhalerao@pw.live",
  "TUITION 36-PJ401NA 2026": "yogesh.bhalerao@pw.live",
  "SIP 36-PJ401NA 2026": "yogesh.bhalerao@pw.live",
  "PJ401NA": "anil.kumar8@pw.live",
  "VIDYAPEETH 36-UF101EA 2026": "aarti.chalikwar@pw.live",
  "36-UF101EA 2026": "aarti.chalikwar@pw.live",
  "TUITION 36-UF101EA 2026": "aarti.chalikwar@pw.live",
  "SIP 36-UF101EA 2026": "aarti.chalikwar@pw.live",
  "VIDYAPEETH 36-UF101ES 2026": "ganesh.gavhane@pw.live",
  "36-UF101ES 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-UF101ES 2026": "ganesh.gavhane@pw.live",
  "SIP 36-UF101ES 2026": "ganesh.gavhane@pw.live",
  "UF101ES": "ganesh.gavhane@pw.live",
  "VIDYAPEETH 36-UP201EA 2026": "aarti.chalikwar@pw.live",
  "36-UP201EA 2026": "aarti.chalikwar@pw.live",
  "TUITION 36-UP201EA 2026": "aarti.chalikwar@pw.live",
  "SIP 36-UP201EA 2026": "aarti.chalikwar@pw.live",
  "VIDYAPEETH 36-YN501MA 2026": "yogesh.bhalerao@pw.live",
  "36-YN501MA 2026": "yogesh.bhalerao@pw.live",
  "TUITION 36-YN501MA 2026": "yogesh.bhalerao@pw.live",
  "SIP 36-YN501MA 2026": "yogesh.bhalerao@pw.live",
  "YN501MA": "aniket.gokhale@pw.live",
  "VIDYAPEETH 94-AJ301EA 2026": "saurabh.tiwari3@pw.live",
  "94-AJ301EA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-AJ301EA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-AJ301EA 2026": "saurabh.tiwari3@pw.live",
  "AJ301EA": "anil.kumar8@pw.live",
  "VIDYAPEETH 94-AN301EA 2026": "saurabh.tiwari3@pw.live",
  "94-AN301EA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-AN301EA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-AN301EA 2026": "saurabh.tiwari3@pw.live",
  "AN301EA": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 94-LJ301EA 2026": "saurabh.tiwari3@pw.live",
  "94-LJ301EA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-LJ301EA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-LJ301EA 2026": "saurabh.tiwari3@pw.live",
  "LJ301EA": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 94-LN301EA 2026": "saurabh.tiwari3@pw.live",
  "94-LN301EA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-LN301EA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-LN301EA 2026": "saurabh.tiwari3@pw.live",
  "LN301EA": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 94-NF201EA 2026": "saurabh.tiwari3@pw.live",
  "94-NF201EA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-NF201EA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-NF201EA 2026": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 94-UF201EA 2026": "saurabh.tiwari3@pw.live",
  "94-UF201EA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-UF201EA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-UF201EA 2026": "saurabh.tiwari3@pw.live",
  "UF201EA": "aarti.chalikwar@pw.live",
  "VIDYAPEETH 94-UP201EA 2026": "saurabh.tiwari3@pw.live",
  "94-UP201EA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-UP201EA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-UP201EA 2026": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 94-YN301MA 2026": "saurabh.tiwari3@pw.live",
  "94-YN301MA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-YN301MA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-YN301MA 2026": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 1H-AJ203MA 2026": "rishabh.paswan@pw.live",
  "1H-AJ203MA 2026": "rishabh.paswan@pw.live",
  "TUITION 1H-AJ203MA 2026": "rishabh.paswan@pw.live",
  "SIP 1H-AJ203MA 2026": "rishabh.paswan@pw.live",
  "AJ203MA": "aniket.gokhale@pw.live",
  "VIDYAPEETH 1H-AJ301NA 2026": "rishabh.paswan@pw.live",
  "1H-AJ301NA 2026": "rishabh.paswan@pw.live",
  "TUITION 1H-AJ301NA 2026": "rishabh.paswan@pw.live",
  "SIP 1H-AJ301NA 2026": "rishabh.paswan@pw.live",
  "AJ301NA": "anil.kumar8@pw.live",
  "VIDYAPEETH 1H-AN202MA 2026": "rishabh.paswan@pw.live",
  "1H-AN202MA 2026": "rishabh.paswan@pw.live",
  "TUITION 1H-AN202MA 2026": "rishabh.paswan@pw.live",
  "SIP 1H-AN202MA 2026": "rishabh.paswan@pw.live",
  "VIDYAPEETH 1H-AN301NA 2026": "rishabh.paswan@pw.live",
  "1H-AN301NA 2026": "rishabh.paswan@pw.live",
  "TUITION 1H-AN301NA 2026": "rishabh.paswan@pw.live",
  "SIP 1H-AN301NA 2026": "rishabh.paswan@pw.live",
  "AN301NA": "anil.kumar8@pw.live",
  "VIDYAPEETH 1H-LJ201MA 2026": "jyoti.sonawane@pw.live",
  "1H-LJ201MA 2026": "jyoti.sonawane@pw.live",
  "TUITION 1H-LJ201MA 2026": "jyoti.sonawane@pw.live",
  "SIP 1H-LJ201MA 2026": "jyoti.sonawane@pw.live",
  "LJ201MA": "soniya.parmar@pw.live",
  "VIDYAPEETH 1H-NF101EA 2026": "jyoti.sonawane@pw.live",
  "1H-NF101EA 2026": "jyoti.sonawane@pw.live",
  "TUITION 1H-NF101EA 2026": "jyoti.sonawane@pw.live",
  "SIP 1H-NF101EA 2026": "jyoti.sonawane@pw.live",
  "VIDYAPEETH 1H-PJ401NA 2026": "rishabh.paswan@pw.live",
  "1H-PJ401NA 2026": "rishabh.paswan@pw.live",
  "TUITION 1H-PJ401NA 2026": "rishabh.paswan@pw.live",
  "SIP 1H-PJ401NA 2026": "rishabh.paswan@pw.live",
  "VIDYAPEETH 1H-UF101EA 2026": "jyoti.sonawane@pw.live",
  "1H-UF101EA 2026": "jyoti.sonawane@pw.live",
  "TUITION 1H-UF101EA 2026": "jyoti.sonawane@pw.live",
  "SIP 1H-UF101EA 2026": "jyoti.sonawane@pw.live",
  "VIDYAPEETH 1H-UP201EA 2026": "jyoti.sonawane@pw.live",
  "1H-UP201EA 2026": "jyoti.sonawane@pw.live",
  "TUITION 1H-UP201EA 2026": "jyoti.sonawane@pw.live",
  "SIP 1H-UP201EA 2026": "jyoti.sonawane@pw.live",
  "VIDYAPEETH 51-AJ202MA 2026": "vishal.rajput2@pw.live",
  "51-AJ202MA 2026": "vishal.rajput2@pw.live",
  "TUITION 51-AJ202MA 2026": "vishal.rajput2@pw.live",
  "SIP 51-AJ202MA 2026": "vishal.rajput2@pw.live",
  "VIDYAPEETH 51-AJ301NA 2026": "manish.kumar11@pw.live",
  "51-AJ301NA 2026": "manish.kumar11@pw.live",
  "TUITION 51-AJ301NA 2026": "manish.kumar11@pw.live",
  "SIP 51-AJ301NA 2026": "manish.kumar11@pw.live",
  "VIDYAPEETH 51-AJ401EA 2026": "manish.kumar11@pw.live",
  "51-AJ401EA 2026": "manish.kumar11@pw.live",
  "TUITION 51-AJ401EA 2026": "manish.kumar11@pw.live",
  "SIP 51-AJ401EA 2026": "manish.kumar11@pw.live",
  "AJ401EA": "prasad.shinde@pw.live",
  "VIDYAPEETH 51-AN201MA 2026": "sakshi.bhardwaj@pw.live",
  "51-AN201MA 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-AN201MA 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-AN201MA 2026": "sakshi.bhardwaj@pw.live",
  "AN201MA": "syed.ali3@pw.live",
  "VIDYAPEETH 51-AN401NA 2026": "manish.kumar11@pw.live",
  "51-AN401NA 2026": "manish.kumar11@pw.live",
  "TUITION 51-AN401NA 2026": "manish.kumar11@pw.live",
  "SIP 51-AN401NA 2026": "manish.kumar11@pw.live",
  "AN401NA": "yogesh.bhalerao@pw.live",
  "VIDYAPEETH 51-LJ101EA 2026": "manish.kumar11@pw.live",
  "51-LJ101EA 2026": "manish.kumar11@pw.live",
  "TUITION 51-LJ101EA 2026": "manish.kumar11@pw.live",
  "SIP 51-LJ101EA 2026": "manish.kumar11@pw.live",
  "LJ101EA": "prasad.shinde@pw.live",
  "VIDYAPEETH 51-LJ101MA 2026": "vishal.rajput2@pw.live",
  "51-LJ101MA 2026": "vishal.rajput2@pw.live",
  "TUITION 51-LJ101MA 2026": "vishal.rajput2@pw.live",
  "SIP 51-LJ101MA 2026": "vishal.rajput2@pw.live",
  "VIDYAPEETH 51-LJ201NA 2026": "manish.kumar11@pw.live",
  "51-LJ201NA 2026": "manish.kumar11@pw.live",
  "TUITION 51-LJ201NA 2026": "manish.kumar11@pw.live",
  "SIP 51-LJ201NA 2026": "manish.kumar11@pw.live",
  "LJ201NA": "manish.kumar11@pw.live",
  "VIDYAPEETH 51-LN101EA 2026": "manish.kumar11@pw.live",
  "51-LN101EA 2026": "manish.kumar11@pw.live",
  "TUITION 51-LN101EA 2026": "manish.kumar11@pw.live",
  "SIP 51-LN101EA 2026": "manish.kumar11@pw.live",
  "LN101EA": "manish.kumar11@pw.live",
  "VIDYAPEETH 51-LN101MA 2026": "sakshi.bhardwaj@pw.live",
  "51-LN101MA 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-LN101MA 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-LN101MA 2026": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH 51-LN201NA 2026": "manish.kumar11@pw.live",
  "51-LN201NA 2026": "manish.kumar11@pw.live",
  "TUITION 51-LN201NA 2026": "manish.kumar11@pw.live",
  "SIP 51-LN201NA 2026": "manish.kumar11@pw.live",
  "LN201NA": "sagar.gaud@pw.live",
  "VIDYAPEETH 51-NF101EA 2026": "manish.kumar11@pw.live",
  "51-NF101EA 2026": "manish.kumar11@pw.live",
  "TUITION 51-NF101EA 2026": "manish.kumar11@pw.live",
  "SIP 51-NF101EA 2026": "manish.kumar11@pw.live",
  "VIDYAPEETH 51-PJ301NA 2026": "manish.kumar11@pw.live",
  "51-PJ301NA 2026": "manish.kumar11@pw.live",
  "TUITION 51-PJ301NA 2026": "manish.kumar11@pw.live",
  "SIP 51-PJ301NA 2026": "manish.kumar11@pw.live",
  "PJ301NA": "manish.kumar11@pw.live",
  "VIDYAPEETH 51-UF101EA 2026": "manish.kumar11@pw.live",
  "51-UF101EA 2026": "manish.kumar11@pw.live",
  "TUITION 51-UF101EA 2026": "manish.kumar11@pw.live",
  "SIP 51-UF101EA 2026": "manish.kumar11@pw.live",
  "VIDYAPEETH 51-UP101WA 2026": "manish.kumar11@pw.live",
  "51-UP101WA 2026": "manish.kumar11@pw.live",
  "TUITION 51-UP101WA 2026": "manish.kumar11@pw.live",
  "SIP 51-UP101WA 2026": "manish.kumar11@pw.live",
  "UP101WA": "manish.kumar11@pw.live",
  "VIDYAPEETH 51-YN301NA 2026": "manish.kumar11@pw.live",
  "51-YN301NA 2026": "manish.kumar11@pw.live",
  "TUITION 51-YN301NA 2026": "manish.kumar11@pw.live",
  "SIP 51-YN301NA 2026": "manish.kumar11@pw.live",
  "YN301NA": "manish.kumar11@pw.live",
  "VIDYAPEETH 51-AJ261MA 2026": "sakshi.bhardwaj@pw.live",
  "51-AJ261MA 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-AJ261MA 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-AJ261MA 2026": "sakshi.bhardwaj@pw.live",
  "AJ261MA": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 51-AJ261NA 2026": "sakshi.bhardwaj@pw.live",
  "51-AJ261NA 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-AJ261NA 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-AJ261NA 2026": "sakshi.bhardwaj@pw.live",
  "AJ261NA": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH 51-AN461NA 2026": "sakshi.bhardwaj@pw.live",
  "51-AN461NA 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-AN461NA 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-AN461NA 2026": "sakshi.bhardwaj@pw.live",
  "AN461NA": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH 51-LJ261MA 2026": "sakshi.bhardwaj@pw.live",
  "51-LJ261MA 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-LJ261MA 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-LJ261MA 2026": "sakshi.bhardwaj@pw.live",
  "LJ261MA": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 51-LJ361NA 2026": "sakshi.bhardwaj@pw.live",
  "51-LJ361NA 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-LJ361NA 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-LJ361NA 2026": "sakshi.bhardwaj@pw.live",
  "LJ361NA": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH 51-LN261MA 2026": "sakshi.bhardwaj@pw.live",
  "51-LN261MA 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-LN261MA 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-LN261MA 2026": "sakshi.bhardwaj@pw.live",
  "LN261MA": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH 51-UF161EA 2026": "sakshi.bhardwaj@pw.live",
  "51-UF161EA 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-UF161EA 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-UF161EA 2026": "sakshi.bhardwaj@pw.live",
  "UF161EA": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH 51-YN561NA 2026": "sakshi.bhardwaj@pw.live",
  "51-YN561NA 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-YN561NA 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-YN561NA 2026": "sakshi.bhardwaj@pw.live",
  "YN561NA": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH 51-AJ231MA 2026": "vivek.kumar19@pw.live",
  "51-AJ231MA 2026": "vivek.kumar19@pw.live",
  "TUITION 51-AJ231MA 2026": "vivek.kumar19@pw.live",
  "SIP 51-AJ231MA 2026": "vivek.kumar19@pw.live",
  "AJ231MA": "vivek.kumar19@pw.live",
  "VIDYAPEETH 51-AJ231EA 2026": "dipali.sonkamble@pw.live",
  "51-AJ231EA 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-AJ231EA 2026": "dipali.sonkamble@pw.live",
  "SIP 51-AJ231EA 2026": "dipali.sonkamble@pw.live",
  "AJ231EA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 51-AJ331NA 2026": "dipali.sonkamble@pw.live",
  "51-AJ331NA 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-AJ331NA 2026": "dipali.sonkamble@pw.live",
  "SIP 51-AJ331NA 2026": "dipali.sonkamble@pw.live",
  "AJ331NA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 51-AN231MA 2026": "vivek.kumar19@pw.live",
  "51-AN231MA 2026": "vivek.kumar19@pw.live",
  "TUITION 51-AN231MA 2026": "vivek.kumar19@pw.live",
  "SIP 51-AN231MA 2026": "vivek.kumar19@pw.live",
  "AN231MA": "vivek.kumar19@pw.live",
  "VIDYAPEETH 51-AN331EA 2026": "dipali.sonkamble@pw.live",
  "51-AN331EA 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-AN331EA 2026": "dipali.sonkamble@pw.live",
  "SIP 51-AN331EA 2026": "dipali.sonkamble@pw.live",
  "AN331EA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 51-LJ131EA 2026": "dipali.sonkamble@pw.live",
  "51-LJ131EA 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-LJ131EA 2026": "dipali.sonkamble@pw.live",
  "SIP 51-LJ131EA 2026": "dipali.sonkamble@pw.live",
  "LJ131EA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 51-LJ131MA 2026": "vivek.kumar19@pw.live",
  "51-LJ131MA 2026": "vivek.kumar19@pw.live",
  "TUITION 51-LJ131MA 2026": "vivek.kumar19@pw.live",
  "SIP 51-LJ131MA 2026": "vivek.kumar19@pw.live",
  "LJ131MA": "vivek.kumar19@pw.live",
  "VIDYAPEETH 51-LN131EA 2026": "dipali.sonkamble@pw.live",
  "51-LN131EA 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-LN131EA 2026": "dipali.sonkamble@pw.live",
  "SIP 51-LN131EA 2026": "dipali.sonkamble@pw.live",
  "LN131EA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 51-LN131MA 2026": "vivek.kumar19@pw.live",
  "51-LN131MA 2026": "vivek.kumar19@pw.live",
  "TUITION 51-LN131MA 2026": "vivek.kumar19@pw.live",
  "SIP 51-LN131MA 2026": "vivek.kumar19@pw.live",
  "LN131MA": "vivek.kumar19@pw.live",
  "VIDYAPEETH 51-NF131EA 2026": "dipali.sonkamble@pw.live",
  "51-NF131EA 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-NF131EA 2026": "dipali.sonkamble@pw.live",
  "SIP 51-NF131EA 2026": "dipali.sonkamble@pw.live",
  "NF131EA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 51-UF131EA 2026": "dipali.sonkamble@pw.live",
  "51-UF131EA 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-UF131EA 2026": "dipali.sonkamble@pw.live",
  "SIP 51-UF131EA 2026": "dipali.sonkamble@pw.live",
  "UF131EA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 51-UP131EA 2026": "dipali.sonkamble@pw.live",
  "51-UP131EA 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-UP131EA 2026": "dipali.sonkamble@pw.live",
  "SIP 51-UP131EA 2026": "dipali.sonkamble@pw.live",
  "UP131EA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 51-YN431NA 2026": "dipali.sonkamble@pw.live",
  "51-YN431NA 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-YN431NA 2026": "dipali.sonkamble@pw.live",
  "SIP 51-YN431NA 2026": "dipali.sonkamble@pw.live",
  "YN431NA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 51-AJ222MA 2026": "anirban.das@pw.live",
  "51-AJ222MA 2026": "anirban.das@pw.live",
  "TUITION 51-AJ222MA 2026": "anirban.das@pw.live",
  "SIP 51-AJ222MA 2026": "anirban.das@pw.live",
  "AJ222MA": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 51-AJ521EA 2026": "ruhi.maqbool@pw.live",
  "51-AJ521EA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-AJ521EA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-AJ521EA 2026": "ruhi.maqbool@pw.live",
  "AJ521EA": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 51-AN221MA 2026": "anirban.das@pw.live",
  "51-AN221MA 2026": "anirban.das@pw.live",
  "TUITION 51-AN221MA 2026": "anirban.das@pw.live",
  "SIP 51-AN221MA 2026": "anirban.das@pw.live",
  "AN221MA": "anirban.das@pw.live",
  "VIDYAPEETH 51-AN321NA 2026": "anirban.das@pw.live",
  "51-AN321NA 2026": "anirban.das@pw.live",
  "TUITION 51-AN321NA 2026": "anirban.das@pw.live",
  "SIP 51-AN321NA 2026": "anirban.das@pw.live",
  "AN321NA": "anirban.das@pw.live",
  "VIDYAPEETH 51-AN521EA 2026": "ruhi.maqbool@pw.live",
  "51-AN521EA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-AN521EA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-AN521EA 2026": "ruhi.maqbool@pw.live",
  "AN521EA": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 51-LJ121NA 2026": "ruhi.maqbool@pw.live",
  "51-LJ121NA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-LJ121NA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-LJ121NA 2026": "ruhi.maqbool@pw.live",
  "LJ121NA": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 51-LJE21MA 2026": "anirban.das@pw.live",
  "51-LJE21MA 2026": "anirban.das@pw.live",
  "TUITION 51-LJE21MA 2026": "anirban.das@pw.live",
  "SIP 51-LJE21MA 2026": "anirban.das@pw.live",
  "LJE21MA": "anirban.das@pw.live",
  "VIDYAPEETH 51-LJE21NA 2026": "ruhi.maqbool@pw.live",
  "51-LJE21NA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-LJE21NA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-LJE21NA 2026": "ruhi.maqbool@pw.live",
  "LJE21NA": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 51-LN121NA 2026": "anirban.das@pw.live",
  "51-LN121NA 2026": "anirban.das@pw.live",
  "TUITION 51-LN121NA 2026": "anirban.das@pw.live",
  "SIP 51-LN121NA 2026": "anirban.das@pw.live",
  "LN121NA": "anirban.das@pw.live",
  "VIDYAPEETH 51-LNE21MA 2026": "anirban.das@pw.live",
  "51-LNE21MA 2026": "anirban.das@pw.live",
  "TUITION 51-LNE21MA 2026": "anirban.das@pw.live",
  "SIP 51-LNE21MA 2026": "anirban.das@pw.live",
  "LNE21MA": "anirban.das@pw.live",
  "VIDYAPEETH 51-LNE21NA 2026": "ruhi.maqbool@pw.live",
  "51-LNE21NA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-LNE21NA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-LNE21NA 2026": "ruhi.maqbool@pw.live",
  "LNE21NA": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 51-NF121EA 2026": "ruhi.maqbool@pw.live",
  "51-NF121EA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-NF121EA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-NF121EA 2026": "ruhi.maqbool@pw.live",
  "NF121EA": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 51-PJ421NA 2026": "ruhi.maqbool@pw.live",
  "51-PJ421NA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-PJ421NA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-PJ421NA 2026": "ruhi.maqbool@pw.live",
  "PJ421NA": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 51-UF121EA 2026": "ruhi.maqbool@pw.live",
  "51-UF121EA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-UF121EA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-UF121EA 2026": "ruhi.maqbool@pw.live",
  "UF121EA": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 51-UP121EA 2026": "ruhi.maqbool@pw.live",
  "51-UP121EA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-UP121EA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-UP121EA 2026": "ruhi.maqbool@pw.live",
  "UP121EA": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 51-YN321NA 2026": "anirban.das@pw.live",
  "51-YN321NA 2026": "anirban.das@pw.live",
  "TUITION 51-YN321NA 2026": "anirban.das@pw.live",
  "SIP 51-YN321NA 2026": "anirban.das@pw.live",
  "YN321NA": "anirban.das@pw.live",
  "VIDYAPEETH 51-AJ291EA 2026": "muzamil.bhat@pw.live",
  "51-AJ291EA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-AJ291EA 2026": "muzamil.bhat@pw.live",
  "SIP 51-AJ291EA 2026": "muzamil.bhat@pw.live",
  "AJ291EA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 51-AJ191MA 2026": "muzamil.bhat@pw.live",
  "51-AJ191MA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-AJ191MA 2026": "muzamil.bhat@pw.live",
  "SIP 51-AJ191MA 2026": "muzamil.bhat@pw.live",
  "AJ191MA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 51-AN191MA 2026": "joyes.ashirwadam@pw.live",
  "51-AN191MA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-AN191MA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-AN191MA 2026": "joyes.ashirwadam@pw.live",
  "AN191MA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 51-AN291EA 2026": "muzamil.bhat@pw.live",
  "51-AN291EA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-AN291EA 2026": "muzamil.bhat@pw.live",
  "SIP 51-AN291EA 2026": "muzamil.bhat@pw.live",
  "AN291EA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 51-LJ191EA 2026": "joyes.ashirwadam@pw.live",
  "51-LJ191EA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-LJ191EA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-LJ191EA 2026": "joyes.ashirwadam@pw.live",
  "LJ191EA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 51-LJ191MA 2026": "muzamil.bhat@pw.live",
  "51-LJ191MA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-LJ191MA 2026": "muzamil.bhat@pw.live",
  "SIP 51-LJ191MA 2026": "muzamil.bhat@pw.live",
  "LJ191MA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 51-LN191MA 2026": "joyes.ashirwadam@pw.live",
  "51-LN191MA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-LN191MA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-LN191MA 2026": "joyes.ashirwadam@pw.live",
  "LN191MA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 51-LN191EA 2026": "muzamil.bhat@pw.live",
  "51-LN191EA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-LN191EA 2026": "muzamil.bhat@pw.live",
  "SIP 51-LN191EA 2026": "muzamil.bhat@pw.live",
  "LN191EA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 51-NF191EA 2026": "joyes.ashirwadam@pw.live",
  "51-NF191EA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-NF191EA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-NF191EA 2026": "joyes.ashirwadam@pw.live",
  "NF191EA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 51-NF191EI 2026": "joyes.ashirwadam@pw.live",
  "51-NF191EI 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-NF191EI 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-NF191EI 2026": "joyes.ashirwadam@pw.live",
  "NF191EI": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 51-PJ391NA 2026": "dipali.sonkamble@pw.live",
  "51-PJ391NA 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-PJ391NA 2026": "dipali.sonkamble@pw.live",
  "SIP 51-PJ391NA 2026": "dipali.sonkamble@pw.live",
  "PJ391NA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 51-UF191EA 2026": "joyes.ashirwadam@pw.live",
  "51-UF191EA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-UF191EA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-UF191EA 2026": "joyes.ashirwadam@pw.live",
  "UF191EA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 51-UF191EI 2026": "joyes.ashirwadam@pw.live",
  "51-UF191EI 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-UF191EI 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-UF191EI 2026": "joyes.ashirwadam@pw.live",
  "UF191EI": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 51-UP191EA 2026": "joyes.ashirwadam@pw.live",
  "51-UP191EA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-UP191EA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-UP191EA 2026": "joyes.ashirwadam@pw.live",
  "UP191EA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 51-YN491NA 2026": "muzamil.bhat@pw.live",
  "51-YN491NA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-YN491NA 2026": "muzamil.bhat@pw.live",
  "SIP 51-YN491NA 2026": "muzamil.bhat@pw.live",
  "YN491NA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 51-AJ271EA 2026": "muzamil.bhat@pw.live",
  "51-AJ271EA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-AJ271EA 2026": "muzamil.bhat@pw.live",
  "SIP 51-AJ271EA 2026": "muzamil.bhat@pw.live",
  "AJ271EA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 51-AN171NA 2026": "joyes.ashirwadam@pw.live",
  "51-AN171NA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-AN171NA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-AN171NA 2026": "joyes.ashirwadam@pw.live",
  "AN171NA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 51-AN271EA 2026": "muzamil.bhat@pw.live",
  "51-AN271EA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-AN271EA 2026": "muzamil.bhat@pw.live",
  "SIP 51-AN271EA 2026": "muzamil.bhat@pw.live",
  "AN271EA": "prasad.shinde@pw.live",
  "VIDYAPEETH 51-AJ272MA 2026": "muzamil.bhat@pw.live",
  "51-AJ272MA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-AJ272MA 2026": "muzamil.bhat@pw.live",
  "SIP 51-AJ272MA 2026": "muzamil.bhat@pw.live",
  "AJ272MA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 51-LJ271EA 2026": "joyes.ashirwadam@pw.live",
  "51-LJ271EA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-LJ271EA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-LJ271EA 2026": "joyes.ashirwadam@pw.live",
  "LJ271EA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 51-LJ271MA 2026": "muzamil.bhat@pw.live",
  "51-LJ271MA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-LJ271MA 2026": "muzamil.bhat@pw.live",
  "SIP 51-LJ271MA 2026": "muzamil.bhat@pw.live",
  "LJ271MA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 51-LN171EA 2026": "joyes.ashirwadam@pw.live",
  "51-LN171EA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-LN171EA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-LN171EA 2026": "joyes.ashirwadam@pw.live",
  "LN171EA": "prasad.shinde@pw.live",
  "VIDYAPEETH 51-NF171EA 2026": "muzamil.bhat@pw.live",
  "51-NF171EA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-NF171EA 2026": "muzamil.bhat@pw.live",
  "SIP 51-NF171EA 2026": "muzamil.bhat@pw.live",
  "NF171EA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 51-UF171EA 2026": "muzamil.bhat@pw.live",
  "51-UF171EA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-UF171EA 2026": "muzamil.bhat@pw.live",
  "SIP 51-UF171EA 2026": "muzamil.bhat@pw.live",
  "UF171EA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 51-UF172EA 2026": "muzamil.bhat@pw.live",
  "51-UF172EA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-UF172EA 2026": "muzamil.bhat@pw.live",
  "SIP 51-UF172EA 2026": "muzamil.bhat@pw.live",
  "UF172EA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 51-UP171EA 2026": "muzamil.bhat@pw.live",
  "51-UP171EA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-UP171EA 2026": "muzamil.bhat@pw.live",
  "SIP 51-UP171EA 2026": "muzamil.bhat@pw.live",
  "UP171EA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 51-YN471NA 2026": "muzamil.bhat@pw.live",
  "51-YN471NA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-YN471NA 2026": "muzamil.bhat@pw.live",
  "SIP 51-YN471NA 2026": "muzamil.bhat@pw.live",
  "YN471NA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 51-AJ253MA 2026": "anup.kumar2@pw.live",
  "51-AJ253MA 2026": "anup.kumar2@pw.live",
  "TUITION 51-AJ253MA 2026": "anup.kumar2@pw.live",
  "SIP 51-AJ253MA 2026": "anup.kumar2@pw.live",
  "AJ253MA": "ashwini.kumar4@pw.live",
  "VIDYAPEETH 51-AN252MA 2026": "anup.kumar2@pw.live",
  "51-AN252MA 2026": "anup.kumar2@pw.live",
  "TUITION 51-AN252MA 2026": "anup.kumar2@pw.live",
  "SIP 51-AN252MA 2026": "anup.kumar2@pw.live",
  "AN252MA": "anup.kumar2@pw.live",
  "VIDYAPEETH 51-AN452NA 2026": "anup.kumar2@pw.live",
  "51-AN452NA 2026": "anup.kumar2@pw.live",
  "TUITION 51-AN452NA 2026": "anup.kumar2@pw.live",
  "SIP 51-AN452NA 2026": "anup.kumar2@pw.live",
  "AN452NA": "anup.kumar2@pw.live",
  "VIDYAPEETH 51-LJ151EA 2026": "anup.kumar2@pw.live",
  "51-LJ151EA 2026": "anup.kumar2@pw.live",
  "TUITION 51-LJ151EA 2026": "anup.kumar2@pw.live",
  "SIP 51-LJ151EA 2026": "anup.kumar2@pw.live",
  "LJ151EA": "anup.kumar2@pw.live",
  "VIDYAPEETH 51-LJ251MA 2026": "anup.kumar2@pw.live",
  "51-LJ251MA 2026": "anup.kumar2@pw.live",
  "TUITION 51-LJ251MA 2026": "anup.kumar2@pw.live",
  "SIP 51-LJ251MA 2026": "anup.kumar2@pw.live",
  "LJ251MA": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 51-LN251NA 2026": "anup.kumar2@pw.live",
  "51-LN251NA 2026": "anup.kumar2@pw.live",
  "TUITION 51-LN251NA 2026": "anup.kumar2@pw.live",
  "SIP 51-LN251NA 2026": "anup.kumar2@pw.live",
  "LN251NA": "anup.kumar2@pw.live",
  "VIDYAPEETH 51-NF151EA 2026": "anup.kumar2@pw.live",
  "51-NF151EA 2026": "anup.kumar2@pw.live",
  "TUITION 51-NF151EA 2026": "anup.kumar2@pw.live",
  "SIP 51-NF151EA 2026": "anup.kumar2@pw.live",
  "NF151EA": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 51-NF151ES 2026": "abhirathi.sarkar@pw.live",
  "51-NF151ES 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-NF151ES 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-NF151ES 2026": "abhirathi.sarkar@pw.live",
  "NF151ES": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 51-PJ351NA 2026": "anup.kumar2@pw.live",
  "51-PJ351NA 2026": "anup.kumar2@pw.live",
  "TUITION 51-PJ351NA 2026": "anup.kumar2@pw.live",
  "SIP 51-PJ351NA 2026": "anup.kumar2@pw.live",
  "PJ351NA": "anup.kumar2@pw.live",
  "VIDYAPEETH 51-UF151EA 2026": "anup.kumar2@pw.live",
  "51-UF151EA 2026": "anup.kumar2@pw.live",
  "TUITION 51-UF151EA 2026": "anup.kumar2@pw.live",
  "SIP 51-UF151EA 2026": "anup.kumar2@pw.live",
  "UF151EA": "lavish.dhingra@pw.live",
  "VIDYAPEETH 51-UF151ES 2026": "abhirathi.sarkar@pw.live",
  "51-UF151ES 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-UF151ES 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-UF151ES 2026": "abhirathi.sarkar@pw.live",
  "UF151ES": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 51-UP151EA 2026": "anup.kumar2@pw.live",
  "51-UP151EA 2026": "anup.kumar2@pw.live",
  "TUITION 51-UP151EA 2026": "anup.kumar2@pw.live",
  "SIP 51-UP151EA 2026": "anup.kumar2@pw.live",
  "UP151EA": "anup.kumar2@pw.live",
  "VIDYAPEETH 51-YN351NA 2026": "abhirathi.sarkar@pw.live",
  "51-YN351NA 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-YN351NA 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-YN351NA 2026": "abhirathi.sarkar@pw.live",
  "YN351NA": "aniket.mishra2@pw.live",
  "VIDYAPEETH 51-AJ181MA 2026": "santosh.kumar5@pw.live",
  "51-AJ181MA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-AJ181MA 2026": "santosh.kumar5@pw.live",
  "SIP 51-AJ181MA 2026": "santosh.kumar5@pw.live",
  "AJ181MA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-AJ281NA 2026": "santosh.kumar5@pw.live",
  "51-AJ281NA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-AJ281NA 2026": "santosh.kumar5@pw.live",
  "SIP 51-AJ281NA 2026": "santosh.kumar5@pw.live",
  "AJ281NA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-AN181MA 2026": "santosh.kumar5@pw.live",
  "51-AN181MA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-AN181MA 2026": "santosh.kumar5@pw.live",
  "SIP 51-AN181MA 2026": "santosh.kumar5@pw.live",
  "AN181MA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-AN281NA 2026": "santosh.kumar5@pw.live",
  "51-AN281NA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-AN281NA 2026": "santosh.kumar5@pw.live",
  "SIP 51-AN281NA 2026": "santosh.kumar5@pw.live",
  "AN281NA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-LJ181MA 2026": "santosh.kumar5@pw.live",
  "51-LJ181MA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-LJ181MA 2026": "santosh.kumar5@pw.live",
  "SIP 51-LJ181MA 2026": "santosh.kumar5@pw.live",
  "LJ181MA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-LJ181NA 2026": "santosh.kumar5@pw.live",
  "51-LJ181NA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-LJ181NA 2026": "santosh.kumar5@pw.live",
  "SIP 51-LJ181NA 2026": "santosh.kumar5@pw.live",
  "LJ181NA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-LN181MA 2026": "santosh.kumar5@pw.live",
  "51-LN181MA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-LN181MA 2026": "santosh.kumar5@pw.live",
  "SIP 51-LN181MA 2026": "santosh.kumar5@pw.live",
  "LN181MA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-LN181NA 2026": "santosh.kumar5@pw.live",
  "51-LN181NA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-LN181NA 2026": "santosh.kumar5@pw.live",
  "SIP 51-LN181NA 2026": "santosh.kumar5@pw.live",
  "LN181NA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-NF181EA 2026": "santosh.kumar5@pw.live",
  "51-NF181EA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-NF181EA 2026": "santosh.kumar5@pw.live",
  "SIP 51-NF181EA 2026": "santosh.kumar5@pw.live",
  "NF181EA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-NFE81EA 2026": "santosh.kumar5@pw.live",
  "51-NFE81EA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-NFE81EA 2026": "santosh.kumar5@pw.live",
  "SIP 51-NFE81EA 2026": "santosh.kumar5@pw.live",
  "NFE81EA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-UF181EA 2026": "santosh.kumar5@pw.live",
  "51-UF181EA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-UF181EA 2026": "santosh.kumar5@pw.live",
  "SIP 51-UF181EA 2026": "santosh.kumar5@pw.live",
  "UF181EA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-UF182EA 2026": "santosh.kumar5@pw.live",
  "51-UF182EA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-UF182EA 2026": "santosh.kumar5@pw.live",
  "SIP 51-UF182EA 2026": "santosh.kumar5@pw.live",
  "UF182EA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-UPE81EA 2026": "santosh.kumar5@pw.live",
  "51-UPE81EA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-UPE81EA 2026": "santosh.kumar5@pw.live",
  "SIP 51-UPE81EA 2026": "santosh.kumar5@pw.live",
  "UPE81EA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-YN581NA 2026": "vishal.rajput2@pw.live",
  "51-YN581NA 2026": "vishal.rajput2@pw.live",
  "TUITION 51-YN581NA 2026": "vishal.rajput2@pw.live",
  "SIP 51-YN581NA 2026": "vishal.rajput2@pw.live",
  "YN581NA": "vishal.rajput2@pw.live",
  "VIDYAPEETH 60-AJ101MA 2026": "sunita.wakle@pw.live",
  "60-AJ101MA 2026": "sunita.wakle@pw.live",
  "TUITION 60-AJ101MA 2026": "sunita.wakle@pw.live",
  "SIP 60-AJ101MA 2026": "sunita.wakle@pw.live",
  "AJ101MA": "sandeep.borase@pw.live",
  "VIDYAPEETH 60-AJ201NA 2026": "sunita.wakle@pw.live",
  "60-AJ201NA 2026": "sunita.wakle@pw.live",
  "TUITION 60-AJ201NA 2026": "sunita.wakle@pw.live",
  "SIP 60-AJ201NA 2026": "sunita.wakle@pw.live",
  "AJ201NA": "prasad.shinde@pw.live",
  "VIDYAPEETH 60-AN101MA 2026": "syed.ali3@pw.live",
  "60-AN101MA 2026": "syed.ali3@pw.live",
  "TUITION 60-AN101MA 2026": "syed.ali3@pw.live",
  "SIP 60-AN101MA 2026": "syed.ali3@pw.live",
  "VIDYAPEETH 60-LJ101NA 2026": "papender.kanwar@pw.live",
  "60-LJ101NA 2026": "papender.kanwar@pw.live",
  "TUITION 60-LJ101NA 2026": "papender.kanwar@pw.live",
  "SIP 60-LJ101NA 2026": "papender.kanwar@pw.live",
  "VIDYAPEETH 60-LN101NA 2026": "saurabh.tiwari3@pw.live",
  "60-LN101NA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 60-LN101NA 2026": "saurabh.tiwari3@pw.live",
  "SIP 60-LN101NA 2026": "saurabh.tiwari3@pw.live",
  "LN101NA": "manish.kumar11@pw.live",
  "VIDYAPEETH 60-NF101EA 2026": "sunita.wakle@pw.live",
  "60-NF101EA 2026": "sunita.wakle@pw.live",
  "TUITION 60-NF101EA 2026": "sunita.wakle@pw.live",
  "SIP 60-NF101EA 2026": "sunita.wakle@pw.live",
  "VIDYAPEETH 60-PJ301MA 2026": "pawan.verma@pw.live",
  "60-PJ301MA 2026": "pawan.verma@pw.live",
  "TUITION 60-PJ301MA 2026": "pawan.verma@pw.live",
  "SIP 60-PJ301MA 2026": "pawan.verma@pw.live",
  "PJ301MA": "pawan.verma@pw.live",
  "VIDYAPEETH 60-UF101EA 2026": "sunita.wakle@pw.live",
  "60-UF101EA 2026": "sunita.wakle@pw.live",
  "TUITION 60-UF101EA 2026": "sunita.wakle@pw.live",
  "SIP 60-UF101EA 2026": "sunita.wakle@pw.live",
  "VIDYAPEETH 60-UP201EA 2026": "sunita.wakle@pw.live",
  "60-UP201EA 2026": "sunita.wakle@pw.live",
  "TUITION 60-UP201EA 2026": "sunita.wakle@pw.live",
  "SIP 60-UP201EA 2026": "sunita.wakle@pw.live",
  "VIDYAPEETH 42-AJ101MA 2026": "jyoti.sonawane@pw.live",
  "42-AJ101MA 2026": "jyoti.sonawane@pw.live",
  "TUITION 42-AJ101MA 2026": "jyoti.sonawane@pw.live",
  "SIP 42-AJ101MA 2026": "jyoti.sonawane@pw.live",
  "VIDYAPEETH 42-AJ201MA 2026": "soniya.parmar@pw.live",
  "42-AJ201MA 2026": "soniya.parmar@pw.live",
  "TUITION 42-AJ201MA 2026": "soniya.parmar@pw.live",
  "SIP 42-AJ201MA 2026": "soniya.parmar@pw.live",
  "AJ201MA": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH 42-AN301MA 2026": "jyoti.sonawane@pw.live",
  "42-AN301MA 2026": "jyoti.sonawane@pw.live",
  "TUITION 42-AN301MA 2026": "jyoti.sonawane@pw.live",
  "SIP 42-AN301MA 2026": "jyoti.sonawane@pw.live",
  "AN301MA": "ganesh.gavhane@pw.live",
  "VIDYAPEETH 42-AN101MA 2026": "jyoti.sonawane@pw.live",
  "42-AN101MA 2026": "jyoti.sonawane@pw.live",
  "TUITION 42-AN101MA 2026": "jyoti.sonawane@pw.live",
  "SIP 42-AN101MA 2026": "jyoti.sonawane@pw.live",
  "VIDYAPEETH 42-LJ101MA 2026": "soniya.parmar@pw.live",
  "42-LJ101MA 2026": "soniya.parmar@pw.live",
  "TUITION 42-LJ101MA 2026": "soniya.parmar@pw.live",
  "SIP 42-LJ101MA 2026": "soniya.parmar@pw.live",
  "VIDYAPEETH 42-LJ101NA 2026": "soniya.parmar@pw.live",
  "42-LJ101NA 2026": "soniya.parmar@pw.live",
  "TUITION 42-LJ101NA 2026": "soniya.parmar@pw.live",
  "SIP 42-LJ101NA 2026": "soniya.parmar@pw.live",
  "VIDYAPEETH 42-LN101MA 2026": "soniya.parmar@pw.live",
  "42-LN101MA 2026": "soniya.parmar@pw.live",
  "TUITION 42-LN101MA 2026": "soniya.parmar@pw.live",
  "SIP 42-LN101MA 2026": "soniya.parmar@pw.live",
  "VIDYAPEETH 42-LNE01NA 2026": "anil.polkamwar@pw.live",
  "42-LNE01NA 2026": "anil.polkamwar@pw.live",
  "TUITION 42-LNE01NA 2026": "anil.polkamwar@pw.live",
  "SIP 42-LNE01NA 2026": "anil.polkamwar@pw.live",
  "VIDYAPEETH 42-NF101EA 2026": "soniya.parmar@pw.live",
  "42-NF101EA 2026": "soniya.parmar@pw.live",
  "TUITION 42-NF101EA 2026": "soniya.parmar@pw.live",
  "SIP 42-NF101EA 2026": "soniya.parmar@pw.live",
  "VIDYAPEETH 42-NF201MS 2026": "soniya.parmar@pw.live",
  "42-NF201MS 2026": "soniya.parmar@pw.live",
  "TUITION 42-NF201MS 2026": "soniya.parmar@pw.live",
  "SIP 42-NF201MS 2026": "soniya.parmar@pw.live",
  "NF201MS": "soniya.parmar@pw.live",
  "VIDYAPEETH 42-PJ401NA 2026": "anil.polkamwar@pw.live",
  "42-PJ401NA 2026": "anil.polkamwar@pw.live",
  "TUITION 42-PJ401NA 2026": "anil.polkamwar@pw.live",
  "SIP 42-PJ401NA 2026": "anil.polkamwar@pw.live",
  "VIDYAPEETH 51-LJ192MA 2026": "muzamil.bhat@pw.live",
  "51-LJ192MA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-LJ192MA 2026": "muzamil.bhat@pw.live",
  "SIP 51-LJ192MA 2026": "muzamil.bhat@pw.live",
  "LJ192MA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 42-UF201MS 2026": "soniya.parmar@pw.live",
  "42-UF201MS 2026": "soniya.parmar@pw.live",
  "TUITION 42-UF201MS 2026": "soniya.parmar@pw.live",
  "SIP 42-UF201MS 2026": "soniya.parmar@pw.live",
  "UF201MS": "soniya.parmar@pw.live",
  "VIDYAPEETH 42-YN401NA 2026": "anil.polkamwar@pw.live",
  "42-YN401NA 2026": "anil.polkamwar@pw.live",
  "TUITION 42-YN401NA 2026": "anil.polkamwar@pw.live",
  "SIP 42-YN401NA 2026": "anil.polkamwar@pw.live",
  "YN401NA": "manish.kumar11@pw.live",
  "VIDYAPEETH 61-AJ101MA 2026": "sandeep.borase@pw.live",
  "61-AJ101MA 2026": "sandeep.borase@pw.live",
  "TUITION 61-AJ101MA 2026": "sandeep.borase@pw.live",
  "SIP 61-AJ101MA 2026": "sandeep.borase@pw.live",
  "VIDYAPEETH 61-AJ301EA 2026": "anil.kumar8@pw.live",
  "61-AJ301EA 2026": "anil.kumar8@pw.live",
  "TUITION 61-AJ301EA 2026": "anil.kumar8@pw.live",
  "SIP 61-AJ301EA 2026": "anil.kumar8@pw.live",
  "VIDYAPEETH 61-AJ201NA 2026": "sagar.gaud@pw.live",
  "61-AJ201NA 2026": "sagar.gaud@pw.live",
  "TUITION 61-AJ201NA 2026": "sagar.gaud@pw.live",
  "SIP 61-AJ201NA 2026": "sagar.gaud@pw.live",
  "VIDYAPEETH 61-AN101MA 2026 (MERGED)": "ankit.shrivastava@pw.live",
  "61-AN101MA 2026": "ankit.shrivastava@pw.live",
  "TUITION 61-AN101MA 2026": "ankit.shrivastava@pw.live",
  "VIDYAPEETH 61-AN101MA 2026": "ankit.shrivastava@pw.live",
  "SIP 61-AN101MA 2026": "ankit.shrivastava@pw.live",
  "AN101MA2026MERGED": "ankit.shrivastava@pw.live",
  "VIDYAPEETH 61-AN301NA 2026": "anil.kumar8@pw.live",
  "61-AN301NA 2026": "anil.kumar8@pw.live",
  "TUITION 61-AN301NA 2026": "anil.kumar8@pw.live",
  "SIP 61-AN301NA 2026": "anil.kumar8@pw.live",
  "VIDYAPEETH 61-LJ101EA 2026": "ankit.shrivastava@pw.live",
  "61-LJ101EA 2026": "ankit.shrivastava@pw.live",
  "TUITION 61-LJ101EA 2026": "ankit.shrivastava@pw.live",
  "SIP 61-LJ101EA 2026": "ankit.shrivastava@pw.live",
  "VIDYAPEETH 61-LJ101MA 2026": "sagar.gaud@pw.live",
  "61-LJ101MA 2026": "sagar.gaud@pw.live",
  "TUITION 61-LJ101MA 2026": "sagar.gaud@pw.live",
  "SIP 61-LJ101MA 2026": "sagar.gaud@pw.live",
  "VIDYAPEETH 61-LJ101NA 2026": "anil.kumar8@pw.live",
  "61-LJ101NA 2026": "anil.kumar8@pw.live",
  "TUITION 61-LJ101NA 2026": "anil.kumar8@pw.live",
  "SIP 61-LJ101NA 2026": "anil.kumar8@pw.live",
  "VIDYAPEETH 61-LN202MA 2026": "ankit.shrivastava@pw.live",
  "61-LN202MA 2026": "ankit.shrivastava@pw.live",
  "TUITION 61-LN202MA 2026": "ankit.shrivastava@pw.live",
  "SIP 61-LN202MA 2026": "ankit.shrivastava@pw.live",
  "LN202MA": "ankit.shrivastava@pw.live",
  "VIDYAPEETH 61-LN201NA 2026": "sagar.gaud@pw.live",
  "61-LN201NA 2026": "sagar.gaud@pw.live",
  "TUITION 61-LN201NA 2026": "sagar.gaud@pw.live",
  "SIP 61-LN201NA 2026": "sagar.gaud@pw.live",
  "VIDYAPEETH 61-LN203MA 2026": "ankit.shrivastava@pw.live",
  "61-LN203MA 2026": "ankit.shrivastava@pw.live",
  "TUITION 61-LN203MA 2026": "ankit.shrivastava@pw.live",
  "SIP 61-LN203MA 2026": "ankit.shrivastava@pw.live",
  "LN203MA": "ankit.shrivastava@pw.live",
  "VIDYAPEETH 61-NF101EA 2026": "anil.kumar8@pw.live",
  "61-NF101EA 2026": "anil.kumar8@pw.live",
  "TUITION 61-NF101EA 2026": "anil.kumar8@pw.live",
  "SIP 61-NF101EA 2026": "anil.kumar8@pw.live",
  "VIDYAPEETH 61-UF101EA 2026": "anil.kumar8@pw.live",
  "61-UF101EA 2026": "anil.kumar8@pw.live",
  "TUITION 61-UF101EA 2026": "anil.kumar8@pw.live",
  "SIP 61-UF101EA 2026": "anil.kumar8@pw.live",
  "VIDYAPEETH 61-UP201EA 2026": "sagar.gaud@pw.live",
  "61-UP201EA 2026": "sagar.gaud@pw.live",
  "TUITION 61-UP201EA 2026": "sagar.gaud@pw.live",
  "SIP 61-UP201EA 2026": "sagar.gaud@pw.live",
  "VIDYAPEETH 61-YN503NA 2026": "sandeep.borase@pw.live",
  "61-YN503NA 2026": "sandeep.borase@pw.live",
  "TUITION 61-YN503NA 2026": "sandeep.borase@pw.live",
  "SIP 61-YN503NA 2026": "sandeep.borase@pw.live",
  "YN503NA": "sandeep.borase@pw.live",
  "VIDYAPEETH 61-YN502NA 2026": "sandeep.borase@pw.live",
  "61-YN502NA 2026": "sandeep.borase@pw.live",
  "TUITION 61-YN502NA 2026": "sandeep.borase@pw.live",
  "SIP 61-YN502NA 2026": "sandeep.borase@pw.live",
  "YN502NA": "sandeep.borase@pw.live",
  "VIDYAPEETH 27-AJ201MA 2026": "prasad.shinde@pw.live",
  "27-AJ201MA 2026": "prasad.shinde@pw.live",
  "TUITION 27-AJ201MA 2026": "prasad.shinde@pw.live",
  "SIP 27-AJ201MA 2026": "prasad.shinde@pw.live",
  "VIDYAPEETH 27-AJ401EA 2026": "prasad.shinde@pw.live",
  "27-AJ401EA 2026": "prasad.shinde@pw.live",
  "TUITION 27-AJ401EA 2026": "prasad.shinde@pw.live",
  "SIP 27-AJ401EA 2026": "prasad.shinde@pw.live",
  "VIDYAPEETH 27-AN201MA 2026": "prasad.shinde@pw.live",
  "27-AN201MA 2026": "prasad.shinde@pw.live",
  "TUITION 27-AN201MA 2026": "prasad.shinde@pw.live",
  "SIP 27-AN201MA 2026": "prasad.shinde@pw.live",
  "VIDYAPEETH 27-LJ101MA 2026": "prasad.shinde@pw.live",
  "27-LJ101MA 2026": "prasad.shinde@pw.live",
  "TUITION 27-LJ101MA 2026": "prasad.shinde@pw.live",
  "SIP 27-LJ101MA 2026": "prasad.shinde@pw.live",
  "VIDYAPEETH 27-LJ101NA 2026": "prasad.shinde@pw.live",
  "27-LJ101NA 2026": "prasad.shinde@pw.live",
  "TUITION 27-LJ101NA 2026": "prasad.shinde@pw.live",
  "SIP 27-LJ101NA 2026": "prasad.shinde@pw.live",
  "VIDYAPEETH 27-LN201MA 2026": "prasad.shinde@pw.live",
  "27-LN201MA 2026": "prasad.shinde@pw.live",
  "TUITION 27-LN201MA 2026": "prasad.shinde@pw.live",
  "SIP 27-LN201MA 2026": "prasad.shinde@pw.live",
  "LN201MA": "ankit.shrivastava@pw.live",
  "VIDYAPEETH 27-YN401NA 2026": "prasad.shinde@pw.live",
  "27-YN401NA 2026": "prasad.shinde@pw.live",
  "TUITION 27-YN401NA 2026": "prasad.shinde@pw.live",
  "SIP 27-YN401NA 2026": "prasad.shinde@pw.live",
  "VIDYAPEETH 27-AJ321EA 2026": "swapnil.jadhav@pw.live",
  "27-AJ321EA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-AJ321EA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-AJ321EA 2026": "swapnil.jadhav@pw.live",
  "AJ321EA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 27-AJ223MA 2026": "yuvraj.hada1@pw.live",
  "27-AJ223MA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-AJ223MA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-AJ223MA 2026": "yuvraj.hada1@pw.live",
  "AJ223MA": "anirban.das@pw.live",
  "VIDYAPEETH 27-AJ421NA 2026": "yuvraj.hada1@pw.live",
  "27-AJ421NA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-AJ421NA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-AJ421NA 2026": "yuvraj.hada1@pw.live",
  "AJ421NA": "anirban.das@pw.live",
  "VIDYAPEETH 27-AN321EA 2026": "yuvraj.hada1@pw.live",
  "27-AN321EA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-AN321EA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-AN321EA 2026": "yuvraj.hada1@pw.live",
  "AN321EA": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 27-AN321MA 2026": "yuvraj.hada1@pw.live",
  "27-AN321MA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-AN321MA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-AN321MA 2026": "yuvraj.hada1@pw.live",
  "AN321MA": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 27-AN521NA 2026": "prasad.shinde@pw.live",
  "27-AN521NA 2026": "prasad.shinde@pw.live",
  "TUITION 27-AN521NA 2026": "prasad.shinde@pw.live",
  "SIP 27-AN521NA 2026": "prasad.shinde@pw.live",
  "AN521NA": "prasad.shinde@pw.live",
  "VIDYAPEETH 27-LJ221EA 2026": "swapnil.jadhav@pw.live",
  "27-LJ221EA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-LJ221EA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-LJ221EA 2026": "swapnil.jadhav@pw.live",
  "LJ221EA": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 27-LJ121MA 2026": "yuvraj.hada1@pw.live",
  "27-LJ121MA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-LJ121MA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-LJ121MA 2026": "yuvraj.hada1@pw.live",
  "LJ121MA": "anirban.das@pw.live",
  "VIDYAPEETH 27-LN121EA 2026": "yuvraj.hada1@pw.live",
  "27-LN121EA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-LN121EA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-LN121EA 2026": "yuvraj.hada1@pw.live",
  "LN121EA": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 27-LN221MA 2026": "yuvraj.hada1@pw.live",
  "27-LN221MA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-LN221MA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-LN221MA 2026": "yuvraj.hada1@pw.live",
  "LN221MA": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 27-NF121EA 2026": "yuvraj.hada1@pw.live",
  "27-NF121EA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-NF121EA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-NF121EA 2026": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 27-PJ321EA 2026": "swapnil.jadhav@pw.live",
  "27-PJ321EA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-PJ321EA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-PJ321EA 2026": "swapnil.jadhav@pw.live",
  "PJ321EA": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 27-UF121EA 2026": "swapnil.jadhav@pw.live",
  "27-UF121EA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-UF121EA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-UF121EA 2026": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 27-UF121EI 2026": "swapnil.jadhav@pw.live",
  "27-UF121EI 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-UF121EI 2026": "swapnil.jadhav@pw.live",
  "SIP 27-UF121EI 2026": "swapnil.jadhav@pw.live",
  "UF121EI": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 27-UP121EA 2026": "swapnil.jadhav@pw.live",
  "27-UP121EA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-UP121EA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-UP121EA 2026": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 27-YN422EA 2026": "swapnil.jadhav@pw.live",
  "27-YN422EA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-YN422EA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-YN422EA 2026": "swapnil.jadhav@pw.live",
  "YN422EA": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 27-AJ262MA 2026": "kanchan.jaiswal@pw.live",
  "27-AJ262MA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-AJ262MA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-AJ262MA 2026": "kanchan.jaiswal@pw.live",
  "AJ262MA": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 27-AJ461EA 2026": "kanchan.jaiswal@pw.live",
  "27-AJ461EA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-AJ461EA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-AJ461EA 2026": "kanchan.jaiswal@pw.live",
  "AJ461EA": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 27-AJ361NA 2026": "swapnil.jadhav@pw.live",
  "27-AJ361NA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-AJ361NA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-AJ361NA 2026": "swapnil.jadhav@pw.live",
  "AJ361NA": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 27-AN261MA 2026": "kanchan.jaiswal@pw.live",
  "27-AN261MA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-AN261MA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-AN261MA 2026": "kanchan.jaiswal@pw.live",
  "AN261MA": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 27-LJ261MA 2026": "kanchan.jaiswal@pw.live",
  "27-LJ261MA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-LJ261MA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-LJ261MA 2026": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 27-LJ261NA 2026": "kanchan.jaiswal@pw.live",
  "27-LJ261NA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-LJ261NA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-LJ261NA 2026": "kanchan.jaiswal@pw.live",
  "LJ261NA": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 27-LJ261EA 2026": "kanchan.jaiswal@pw.live",
  "27-LJ261EA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-LJ261EA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-LJ261EA 2026": "kanchan.jaiswal@pw.live",
  "LJ261EA": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 27-LN161MA 2026": "kanchan.jaiswal@pw.live",
  "27-LN161MA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-LN161MA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-LN161MA 2026": "kanchan.jaiswal@pw.live",
  "LN161MA": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 27-LN261NA 2026": "kanchan.jaiswal@pw.live",
  "27-LN261NA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-LN261NA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-LN261NA 2026": "kanchan.jaiswal@pw.live",
  "LN261NA": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 27-NF261EA 2026": "kanchan.jaiswal@pw.live",
  "27-NF261EA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-NF261EA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-NF261EA 2026": "kanchan.jaiswal@pw.live",
  "NF261EA": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 27-UF261EA 2026": "kanchan.jaiswal@pw.live",
  "27-UF261EA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-UF261EA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-UF261EA 2026": "kanchan.jaiswal@pw.live",
  "UF261EA": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 27-UP261EA 2026": "prasad.shinde@pw.live",
  "27-UP261EA 2026": "prasad.shinde@pw.live",
  "TUITION 27-UP261EA 2026": "prasad.shinde@pw.live",
  "SIP 27-UP261EA 2026": "prasad.shinde@pw.live",
  "UP261EA": "prasad.shinde@pw.live",
  "VIDYAPEETH 27-YN461NA 2026": "kanchan.jaiswal@pw.live",
  "27-YN461NA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-YN461NA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-YN461NA 2026": "kanchan.jaiswal@pw.live",
  "YN461NA": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 27-AJ255MA 2026": "meenakshi.chauhan1@pw.live",
  "27-AJ255MA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-AJ255MA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-AJ255MA 2026": "meenakshi.chauhan1@pw.live",
  "AJ255MA": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 27-AJ251EA 2026": "meenakshi.chauhan1@pw.live",
  "27-AJ251EA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-AJ251EA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-AJ251EA 2026": "meenakshi.chauhan1@pw.live",
  "AJ251EA": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 27-AJ251NA 2026": "meenakshi.chauhan1@pw.live",
  "27-AJ251NA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-AJ251NA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-AJ251NA 2026": "meenakshi.chauhan1@pw.live",
  "AJ251NA": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 27-AN151MA 2026": "meenakshi.chauhan1@pw.live",
  "27-AN151MA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-AN151MA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-AN151MA 2026": "meenakshi.chauhan1@pw.live",
  "AN151MA": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 27-AN351NA 2026": "aniket.mishra2@pw.live",
  "27-AN351NA 2026": "aniket.mishra2@pw.live",
  "TUITION 27-AN351NA 2026": "aniket.mishra2@pw.live",
  "SIP 27-AN351NA 2026": "aniket.mishra2@pw.live",
  "AN351NA": "aniket.mishra2@pw.live",
  "VIDYAPEETH 27-AN351EA 2026": "meenakshi.chauhan1@pw.live",
  "27-AN351EA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-AN351EA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-AN351EA 2026": "meenakshi.chauhan1@pw.live",
  "AN351EA": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 27-LJ251EA 2026": "meenakshi.chauhan1@pw.live",
  "27-LJ251EA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-LJ251EA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-LJ251EA 2026": "meenakshi.chauhan1@pw.live",
  "LJ251EA": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 27-LJ252MA 2026": "lavish.dhingra@pw.live",
  "27-LJ252MA 2026": "lavish.dhingra@pw.live",
  "TUITION 27-LJ252MA 2026": "lavish.dhingra@pw.live",
  "SIP 27-LJ252MA 2026": "lavish.dhingra@pw.live",
  "LJ252MA": "lavish.dhingra@pw.live",
  "VIDYAPEETH 27-LJ151NA 2026": "aniket.mishra2@pw.live",
  "27-LJ151NA 2026": "aniket.mishra2@pw.live",
  "TUITION 27-LJ151NA 2026": "aniket.mishra2@pw.live",
  "SIP 27-LJ151NA 2026": "aniket.mishra2@pw.live",
  "LJ151NA": "anup.kumar2@pw.live",
  "VIDYAPEETH 27-LJE51MA 2026": "meenakshi.chauhan1@pw.live",
  "27-LJE51MA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-LJE51MA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-LJE51MA 2026": "meenakshi.chauhan1@pw.live",
  "LJE51MA": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 27-LN151EA 2026": "ashwini.kumar4@pw.live",
  "27-LN151EA 2026": "ashwini.kumar4@pw.live",
  "TUITION 27-LN151EA 2026": "ashwini.kumar4@pw.live",
  "SIP 27-LN151EA 2026": "ashwini.kumar4@pw.live",
  "LN151EA": "ashwini.kumar4@pw.live",
  "VIDYAPEETH 27-LN151MA 2026": "meenakshi.chauhan1@pw.live",
  "27-LN151MA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-LN151MA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-LN151MA 2026": "meenakshi.chauhan1@pw.live",
  "LN151MA": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 27-LN151NA 2026": "aniket.mishra2@pw.live",
  "27-LN151NA 2026": "aniket.mishra2@pw.live",
  "TUITION 27-LN151NA 2026": "aniket.mishra2@pw.live",
  "SIP 27-LN151NA 2026": "aniket.mishra2@pw.live",
  "LN151NA": "anup.kumar2@pw.live",
  "VIDYAPEETH 27-NF151EA 2026": "meenakshi.chauhan1@pw.live",
  "27-NF151EA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-NF151EA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-NF151EA 2026": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 27-PJ451NA 2026": "aniket.mishra2@pw.live",
  "27-PJ451NA 2026": "aniket.mishra2@pw.live",
  "TUITION 27-PJ451NA 2026": "aniket.mishra2@pw.live",
  "SIP 27-PJ451NA 2026": "aniket.mishra2@pw.live",
  "PJ451NA": "aniket.mishra2@pw.live",
  "VIDYAPEETH 27-UF151EA 2026": "lavish.dhingra@pw.live",
  "27-UF151EA 2026": "lavish.dhingra@pw.live",
  "TUITION 27-UF151EA 2026": "lavish.dhingra@pw.live",
  "SIP 27-UF151EA 2026": "lavish.dhingra@pw.live",
  "VIDYAPEETH 27-UP251EA 2026": "meenakshi.chauhan1@pw.live",
  "27-UP251EA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-UP251EA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-UP251EA 2026": "meenakshi.chauhan1@pw.live",
  "UP251EA": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 27-YN351NA 2026": "aniket.mishra2@pw.live",
  "27-YN351NA 2026": "aniket.mishra2@pw.live",
  "TUITION 27-YN351NA 2026": "aniket.mishra2@pw.live",
  "SIP 27-YN351NA 2026": "aniket.mishra2@pw.live",
  "VIDYAPEETH 27-AJ273MA 2026": "nitish.kumar6@pw.live",
  "27-AJ273MA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-AJ273MA 2026": "nitish.kumar6@pw.live",
  "SIP 27-AJ273MA 2026": "nitish.kumar6@pw.live",
  "AJ273MA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 27-AJ271EA 2026": "nitish.kumar6@pw.live",
  "27-AJ271EA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-AJ271EA 2026": "nitish.kumar6@pw.live",
  "SIP 27-AJ271EA 2026": "nitish.kumar6@pw.live",
  "VIDYAPEETH 27-AJ471NA 2026": "nitish.kumar6@pw.live",
  "27-AJ471NA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-AJ471NA 2026": "nitish.kumar6@pw.live",
  "SIP 27-AJ471NA 2026": "nitish.kumar6@pw.live",
  "AJ471NA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 27-AN271MA 2026": "nitish.kumar6@pw.live",
  "27-AN271MA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-AN271MA 2026": "nitish.kumar6@pw.live",
  "SIP 27-AN271MA 2026": "nitish.kumar6@pw.live",
  "AN271MA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 27-AN271EA 2026": "prasad.shinde@pw.live",
  "27-AN271EA 2026": "prasad.shinde@pw.live",
  "TUITION 27-AN271EA 2026": "prasad.shinde@pw.live",
  "SIP 27-AN271EA 2026": "prasad.shinde@pw.live",
  "VIDYAPEETH 27-LJ272EA 2026": "nitish.kumar6@pw.live",
  "27-LJ272EA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-LJ272EA 2026": "nitish.kumar6@pw.live",
  "SIP 27-LJ272EA 2026": "nitish.kumar6@pw.live",
  "LJ272EA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 27-LJ171MA 2026": "nitish.kumar6@pw.live",
  "27-LJ171MA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-LJ171MA 2026": "nitish.kumar6@pw.live",
  "SIP 27-LJ171MA 2026": "nitish.kumar6@pw.live",
  "LJ171MA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 27-LJ171NA 2026": "nitish.kumar6@pw.live",
  "27-LJ171NA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-LJ171NA 2026": "nitish.kumar6@pw.live",
  "SIP 27-LJ171NA 2026": "nitish.kumar6@pw.live",
  "LJ171NA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 27-LN171EA 2026": "prasad.shinde@pw.live",
  "27-LN171EA 2026": "prasad.shinde@pw.live",
  "TUITION 27-LN171EA 2026": "prasad.shinde@pw.live",
  "SIP 27-LN171EA 2026": "prasad.shinde@pw.live",
  "VIDYAPEETH 27-LN171MA 2026": "prasad.shinde@pw.live",
  "27-LN171MA 2026": "prasad.shinde@pw.live",
  "TUITION 27-LN171MA 2026": "prasad.shinde@pw.live",
  "SIP 27-LN171MA 2026": "prasad.shinde@pw.live",
  "LN171MA": "prasad.shinde@pw.live",
  "VIDYAPEETH 27-NF271EA 2026": "nitish.kumar6@pw.live",
  "27-NF271EA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-NF271EA 2026": "nitish.kumar6@pw.live",
  "SIP 27-NF271EA 2026": "nitish.kumar6@pw.live",
  "NF271EA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 27-PJ471EA 2026": "prasad.shinde@pw.live",
  "27-PJ471EA 2026": "prasad.shinde@pw.live",
  "TUITION 27-PJ471EA 2026": "prasad.shinde@pw.live",
  "SIP 27-PJ471EA 2026": "prasad.shinde@pw.live",
  "PJ471EA": "prasad.shinde@pw.live",
  "VIDYAPEETH 27-UF171EA 2026": "nitish.kumar6@pw.live",
  "27-UF171EA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-UF171EA 2026": "nitish.kumar6@pw.live",
  "SIP 27-UF171EA 2026": "nitish.kumar6@pw.live",
  "VIDYAPEETH 27-UP171EA 2026": "nitish.kumar6@pw.live",
  "27-UP171EA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-UP171EA 2026": "nitish.kumar6@pw.live",
  "SIP 27-UP171EA 2026": "nitish.kumar6@pw.live",
  "VIDYAPEETH 27-YN471EA 2026": "nitish.kumar6@pw.live",
  "27-YN471EA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-YN471EA 2026": "nitish.kumar6@pw.live",
  "SIP 27-YN471EA 2026": "nitish.kumar6@pw.live",
  "YN471EA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 51-LJ271NA 2026": "joyes.ashirwadam@pw.live",
  "51-LJ271NA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-LJ271NA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-LJ271NA 2026": "joyes.ashirwadam@pw.live",
  "LJ271NA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 51-LJ121MP 2026": "anirban.das@pw.live",
  "51-LJ121MP 2026": "anirban.das@pw.live",
  "TUITION 51-LJ121MP 2026": "anirban.das@pw.live",
  "SIP 51-LJ121MP 2026": "anirban.das@pw.live",
  "LJ121MP": "anirban.das@pw.live",
  "VIDYAPEETH 51-LN121NP 2026": "ruhi.maqbool@pw.live",
  "51-LN121NP 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-LN121NP 2026": "ruhi.maqbool@pw.live",
  "SIP 51-LN121NP 2026": "ruhi.maqbool@pw.live",
  "LN121NP": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 51-LJ151MP 2026": "abhirathi.sarkar@pw.live",
  "51-LJ151MP 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-LJ151MP 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-LJ151MP 2026": "abhirathi.sarkar@pw.live",
  "LJ151MP": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 51-LN151MP 2026": "abhirathi.sarkar@pw.live",
  "51-LN151MP 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-LN151MP 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-LN151MP 2026": "abhirathi.sarkar@pw.live",
  "LN151MP": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 51-LJ121EA 2026": "ruhi.maqbool@pw.live",
  "51-LJ121EA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-LJ121EA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-LJ121EA 2026": "ruhi.maqbool@pw.live",
  "LJ121EA": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 69-LJE03NA 2026": "niraj.verma2@pw.live",
  "69-LJE03NA 2026": "niraj.verma2@pw.live",
  "TUITION 69-LJE03NA 2026": "niraj.verma2@pw.live",
  "SIP 69-LJE03NA 2026": "niraj.verma2@pw.live",
  "LJE03NA": "niraj.verma2@pw.live",
  "VIDYAPEETH 69-LJE04NA 2026": "kishor.gaikwad1@pw.live",
  "69-LJE04NA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-LJE04NA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-LJE04NA 2026": "kishor.gaikwad1@pw.live",
  "LJE04NA": "kishor.gaikwad1@pw.live",
  "VIDYAPEETH 42-LJ102MA 2026": "soniya.parmar@pw.live",
  "42-LJ102MA 2026": "soniya.parmar@pw.live",
  "TUITION 42-LJ102MA 2026": "soniya.parmar@pw.live",
  "SIP 42-LJ102MA 2026": "soniya.parmar@pw.live",
  "LJ102MA": "sagar.gaud@pw.live",
  "VIDYAPEETH 60-LJ101NP 2026": "papender.kanwar@pw.live",
  "60-LJ101NP 2026": "papender.kanwar@pw.live",
  "TUITION 60-LJ101NP 2026": "papender.kanwar@pw.live",
  "SIP 60-LJ101NP 2026": "papender.kanwar@pw.live",
  "LJ101NP": "anil.polkamwar@pw.live",
  "VIDYAPEETH 60-LN101NP 2026": "papender.kanwar@pw.live",
  "60-LN101NP 2026": "papender.kanwar@pw.live",
  "TUITION 60-LN101NP 2026": "papender.kanwar@pw.live",
  "SIP 60-LN101NP 2026": "papender.kanwar@pw.live",
  "LN101NP": "anil.polkamwar@pw.live",
  "VIDYAPEETH 69-LJ101NA 2026": "niraj.verma2@pw.live",
  "69-LJ101NA 2026": "niraj.verma2@pw.live",
  "TUITION 69-LJ101NA 2026": "niraj.verma2@pw.live",
  "SIP 69-LJ101NA 2026": "niraj.verma2@pw.live",
  "VIDYAPEETH 69-LJ102NA 2026": "niraj.verma2@pw.live",
  "69-LJ102NA 2026": "niraj.verma2@pw.live",
  "TUITION 69-LJ102NA 2026": "niraj.verma2@pw.live",
  "SIP 69-LJ102NA 2026": "niraj.verma2@pw.live",
  "LJ102NA": "prasad.shinde@pw.live",
  "VIDYAPEETH 69-LJE01MP 2026": "kishor.gaikwad1@pw.live",
  "69-LJE01MP 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-LJE01MP 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-LJE01MP 2026": "kishor.gaikwad1@pw.live",
  "LJE01MP": "yogesh.bhalerao@pw.live",
  "VIDYAPEETH 69-LJE05NA 2026 (MERGED)": "kishor.gaikwad1@pw.live",
  "69-LJE05NA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-LJE05NA 2026": "kishor.gaikwad1@pw.live",
  "VIDYAPEETH 69-LJE05NA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-LJE05NA 2026": "kishor.gaikwad1@pw.live",
  "LJE05NA2026MERGED": "kishor.gaikwad1@pw.live",
  "LJE05NA": "kishor.gaikwad1@pw.live",
  "VIDYAPEETH 69-LNE01MP 2026": "niraj.verma2@pw.live",
  "69-LNE01MP 2026": "niraj.verma2@pw.live",
  "TUITION 69-LNE01MP 2026": "niraj.verma2@pw.live",
  "SIP 69-LNE01MP 2026": "niraj.verma2@pw.live",
  "LNE01MP": "ganesh.gavhane@pw.live",
  "VIDYAPEETH 69-LNE03NA 2026": "niraj.verma2@pw.live",
  "69-LNE03NA 2026": "niraj.verma2@pw.live",
  "TUITION 69-LNE03NA 2026": "niraj.verma2@pw.live",
  "SIP 69-LNE03NA 2026": "niraj.verma2@pw.live",
  "LNE03NA": "niraj.verma2@pw.live",
  "VIDYAPEETH 51-LN101NA 2026": "manish.kumar11@pw.live",
  "51-LN101NA 2026": "manish.kumar11@pw.live",
  "TUITION 51-LN101NA 2026": "manish.kumar11@pw.live",
  "SIP 51-LN101NA 2026": "manish.kumar11@pw.live",
  "VIDYAPEETH 51-LJ122EA 2026": "ruhi.maqbool@pw.live",
  "51-LJ122EA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-LJ122EA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-LJ122EA 2026": "ruhi.maqbool@pw.live",
  "LJ122EA": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 51-LJ151NA 2026": "anup.kumar2@pw.live",
  "51-LJ151NA 2026": "anup.kumar2@pw.live",
  "TUITION 51-LJ151NA 2026": "anup.kumar2@pw.live",
  "SIP 51-LJ151NA 2026": "anup.kumar2@pw.live",
  "VIDYAPEETH 27-LN271NA 2026": "nitish.kumar6@pw.live",
  "27-LN271NA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-LN271NA 2026": "nitish.kumar6@pw.live",
  "SIP 27-LN271NA 2026": "nitish.kumar6@pw.live",
  "LN271NA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 51-NF121ES 2026": "ruhi.maqbool@pw.live",
  "51-NF121ES 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-NF121ES 2026": "ruhi.maqbool@pw.live",
  "SIP 51-NF121ES 2026": "ruhi.maqbool@pw.live",
  "NF121ES": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 51-LJ191NP 2026": "dipali.sonkamble@pw.live",
  "51-LJ191NP 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-LJ191NP 2026": "dipali.sonkamble@pw.live",
  "SIP 51-LJ191NP 2026": "dipali.sonkamble@pw.live",
  "LJ191NP": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 61-LJ103MA 2026": "sagar.gaud@pw.live",
  "61-LJ103MA 2026": "sagar.gaud@pw.live",
  "TUITION 61-LJ103MA 2026": "sagar.gaud@pw.live",
  "SIP 61-LJ103MA 2026": "sagar.gaud@pw.live",
  "LJ103MA": "sagar.gaud@pw.live",
  "VIDYAPEETH 69-AJ201MA 2026": "kishor.gaikwad1@pw.live",
  "69-AJ201MA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-AJ201MA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-AJ201MA 2026": "kishor.gaikwad1@pw.live",
  "VIDYAPEETH 69-AJ202MA 2026": "kishor.gaikwad1@pw.live",
  "69-AJ202MA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-AJ202MA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-AJ202MA 2026": "kishor.gaikwad1@pw.live",
  "VIDYAPEETH 69-AN201MA 2026": "kishor.gaikwad1@pw.live",
  "69-AN201MA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-AN201MA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-AN201MA 2026": "kishor.gaikwad1@pw.live",
  "VIDYAPEETH 69-LNE02NA 2026": "niraj.verma2@pw.live",
  "69-LNE02NA 2026": "niraj.verma2@pw.live",
  "TUITION 69-LNE02NA 2026": "niraj.verma2@pw.live",
  "SIP 69-LNE02NA 2026": "niraj.verma2@pw.live",
  "LNE02NA": "niraj.verma2@pw.live",
  "VIDYAPEETH 42-UF101EA 2026": "soniya.parmar@pw.live",
  "42-UF101EA 2026": "soniya.parmar@pw.live",
  "TUITION 42-UF101EA 2026": "soniya.parmar@pw.live",
  "SIP 42-UF101EA 2026": "soniya.parmar@pw.live",
  "VIDYAPEETH 36-AJ201MA 2026": "aarti.chalikwar@pw.live",
  "36-AJ201MA 2026": "aarti.chalikwar@pw.live",
  "TUITION 36-AJ201MA 2026": "aarti.chalikwar@pw.live",
  "SIP 36-AJ201MA 2026": "aarti.chalikwar@pw.live",
  "VIDYAPEETH 36-AN201MA 2026": "ganesh.gavhane@pw.live",
  "36-AN201MA 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-AN201MA 2026": "ganesh.gavhane@pw.live",
  "SIP 36-AN201MA 2026": "ganesh.gavhane@pw.live",
  "VIDYAPEETH 36-LJ102NA 2026": "ganesh.gavhane@pw.live",
  "36-LJ102NA 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-LJ102NA 2026": "ganesh.gavhane@pw.live",
  "SIP 36-LJ102NA 2026": "ganesh.gavhane@pw.live",
  "VIDYAPEETH 36-LJ103NA 2026": "ganesh.gavhane@pw.live",
  "36-LJ103NA 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-LJ103NA 2026": "ganesh.gavhane@pw.live",
  "SIP 36-LJ103NA 2026": "ganesh.gavhane@pw.live",
  "LJ103NA": "anil.kumar8@pw.live",
  "VIDYAPEETH 36-LJ104NA 2026": "aarti.chalikwar@pw.live",
  "36-LJ104NA 2026": "aarti.chalikwar@pw.live",
  "TUITION 36-LJ104NA 2026": "aarti.chalikwar@pw.live",
  "SIP 36-LJ104NA 2026": "aarti.chalikwar@pw.live",
  "LJ104NA": "pawan.verma@pw.live",
  "VIDYAPEETH 36-LJ105NA 2026": "aarti.chalikwar@pw.live",
  "36-LJ105NA 2026": "aarti.chalikwar@pw.live",
  "TUITION 36-LJ105NA 2026": "aarti.chalikwar@pw.live",
  "SIP 36-LJ105NA 2026": "aarti.chalikwar@pw.live",
  "LJ105NA": "pawan.verma@pw.live",
  "VIDYAPEETH 36-LJ106NA 2026": "aarti.chalikwar@pw.live",
  "36-LJ106NA 2026": "aarti.chalikwar@pw.live",
  "TUITION 36-LJ106NA 2026": "aarti.chalikwar@pw.live",
  "SIP 36-LJ106NA 2026": "aarti.chalikwar@pw.live",
  "LJ106NA": "pawan.verma@pw.live",
  "VIDYAPEETH 36-LJ107NA 2026": "aarti.chalikwar@pw.live",
  "36-LJ107NA 2026": "aarti.chalikwar@pw.live",
  "TUITION 36-LJ107NA 2026": "aarti.chalikwar@pw.live",
  "SIP 36-LJ107NA 2026": "aarti.chalikwar@pw.live",
  "LJ107NA": "pawan.verma@pw.live",
  "VIDYAPEETH 36-LJE01MP 2026": "yogesh.bhalerao@pw.live",
  "36-LJE01MP 2026": "yogesh.bhalerao@pw.live",
  "TUITION 36-LJE01MP 2026": "yogesh.bhalerao@pw.live",
  "SIP 36-LJE01MP 2026": "yogesh.bhalerao@pw.live",
  "VIDYAPEETH 36-LM101NA 2026": "ganesh.gavhane@pw.live",
  "36-LM101NA 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-LM101NA 2026": "ganesh.gavhane@pw.live",
  "SIP 36-LM101NA 2026": "ganesh.gavhane@pw.live",
  "LM101NA": "soniya.parmar@pw.live",
  "VIDYAPEETH 36-LN102MA 2026": "aarti.chalikwar@pw.live",
  "36-LN102MA 2026": "aarti.chalikwar@pw.live",
  "TUITION 36-LN102MA 2026": "aarti.chalikwar@pw.live",
  "SIP 36-LN102MA 2026": "aarti.chalikwar@pw.live",
  "LN102MA": "aarti.chalikwar@pw.live",
  "VIDYAPEETH 36-LNE01MP 2026": "ganesh.gavhane@pw.live",
  "36-LNE01MP 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-LNE01MP 2026": "ganesh.gavhane@pw.live",
  "SIP 36-LNE01MP 2026": "ganesh.gavhane@pw.live",
  "VIDYAPEETH 1H-AJ201MA 2026": "rishabh.paswan@pw.live",
  "1H-AJ201MA 2026": "rishabh.paswan@pw.live",
  "TUITION 1H-AJ201MA 2026": "rishabh.paswan@pw.live",
  "SIP 1H-AJ201MA 2026": "rishabh.paswan@pw.live",
  "VIDYAPEETH 51-LJ102MA 2026": "vishal.rajput2@pw.live",
  "51-LJ102MA 2026": "vishal.rajput2@pw.live",
  "TUITION 51-LJ102MA 2026": "vishal.rajput2@pw.live",
  "SIP 51-LJ102MA 2026": "vishal.rajput2@pw.live",
  "VIDYAPEETH 51-LJ101MP 2026": "sakshi.bhardwaj@pw.live",
  "51-LJ101MP 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-LJ101MP 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-LJ101MP 2026": "sakshi.bhardwaj@pw.live",
  "LJ101MP": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH 51-LN101MP 2026": "sakshi.bhardwaj@pw.live",
  "51-LN101MP 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-LN101MP 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-LN101MP 2026": "sakshi.bhardwaj@pw.live",
  "LN101MP": "ankit.shrivastava@pw.live",
  "VIDYAPEETH 51-LJ361MA 2026": "sakshi.bhardwaj@pw.live",
  "51-LJ361MA 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-LJ361MA 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-LJ361MA 2026": "sakshi.bhardwaj@pw.live",
  "LJ361MA": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH 51-AJ131MP 2026": "vivek.kumar19@pw.live",
  "51-AJ131MP 2026": "vivek.kumar19@pw.live",
  "TUITION 51-AJ131MP 2026": "vivek.kumar19@pw.live",
  "SIP 51-AJ131MP 2026": "vivek.kumar19@pw.live",
  "AJ131MP": "vivek.kumar19@pw.live",
  "VIDYAPEETH 51-LJ131MP 2026": "vivek.kumar19@pw.live",
  "51-LJ131MP 2026": "vivek.kumar19@pw.live",
  "TUITION 51-LJ131MP 2026": "vivek.kumar19@pw.live",
  "SIP 51-LJ131MP 2026": "vivek.kumar19@pw.live",
  "LJ131MP": "vivek.kumar19@pw.live",
  "VIDYAPEETH 51-AJ223MA 2026": "anirban.das@pw.live",
  "51-AJ223MA 2026": "anirban.das@pw.live",
  "TUITION 51-AJ223MA 2026": "anirban.das@pw.live",
  "SIP 51-AJ223MA 2026": "anirban.das@pw.live",
  "VIDYAPEETH 51-AN222MA 2026": "anirban.das@pw.live",
  "51-AN222MA 2026": "anirban.das@pw.live",
  "TUITION 51-AN222MA 2026": "anirban.das@pw.live",
  "SIP 51-AN222MA 2026": "anirban.das@pw.live",
  "AN222MA": "anirban.das@pw.live",
  "VIDYAPEETH 51-LJ121MA 2026": "anirban.das@pw.live",
  "51-LJ121MA 2026": "anirban.das@pw.live",
  "TUITION 51-LJ121MA 2026": "anirban.das@pw.live",
  "SIP 51-LJ121MA 2026": "anirban.das@pw.live",
  "VIDYAPEETH 51-LJE22NA 2026": "ruhi.maqbool@pw.live",
  "51-LJE22NA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-LJE22NA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-LJE22NA 2026": "ruhi.maqbool@pw.live",
  "LJE22NA": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 51-LJE23MA 2026": "anirban.das@pw.live",
  "51-LJE23MA 2026": "anirban.das@pw.live",
  "TUITION 51-LJE23MA 2026": "anirban.das@pw.live",
  "SIP 51-LJE23MA 2026": "anirban.das@pw.live",
  "LJE23MA": "anirban.das@pw.live",
  "VIDYAPEETH 51-LJE23NA 2026": "ruhi.maqbool@pw.live",
  "51-LJE23NA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-LJE23NA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-LJE23NA 2026": "ruhi.maqbool@pw.live",
  "LJE23NA": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 51-LJE24MA 2026": "anirban.das@pw.live",
  "51-LJE24MA 2026": "anirban.das@pw.live",
  "TUITION 51-LJE24MA 2026": "anirban.das@pw.live",
  "SIP 51-LJE24MA 2026": "anirban.das@pw.live",
  "LJE24MA": "anirban.das@pw.live",
  "VIDYAPEETH 51-LNE22MA 2026": "anirban.das@pw.live",
  "51-LNE22MA 2026": "anirban.das@pw.live",
  "TUITION 51-LNE22MA 2026": "anirban.das@pw.live",
  "SIP 51-LNE22MA 2026": "anirban.das@pw.live",
  "LNE22MA": "anirban.das@pw.live",
  "VIDYAPEETH 51-LNE22NA 2026": "anirban.das@pw.live",
  "51-LNE22NA 2026": "anirban.das@pw.live",
  "TUITION 51-LNE22NA 2026": "anirban.das@pw.live",
  "SIP 51-LNE22NA 2026": "anirban.das@pw.live",
  "LNE22NA": "anirban.das@pw.live",
  "VIDYAPEETH 51-UF122EA 2026": "ruhi.maqbool@pw.live",
  "51-UF122EA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-UF122EA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-UF122EA 2026": "ruhi.maqbool@pw.live",
  "UF122EA": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 51-AJ271MA 2026": "muzamil.bhat@pw.live",
  "51-AJ271MA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-AJ271MA 2026": "muzamil.bhat@pw.live",
  "SIP 51-AJ271MA 2026": "muzamil.bhat@pw.live",
  "AJ271MA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 51-UF173EA 2026": "muzamil.bhat@pw.live",
  "51-UF173EA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-UF173EA 2026": "muzamil.bhat@pw.live",
  "SIP 51-UF173EA 2026": "muzamil.bhat@pw.live",
  "UF173EA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 51-AJ251MA 2026": "abhirathi.sarkar@pw.live",
  "51-AJ251MA 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-AJ251MA 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-AJ251MA 2026": "abhirathi.sarkar@pw.live",
  "AJ251MA": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 51-AN251MA 2026": "abhirathi.sarkar@pw.live",
  "51-AN251MA 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-AN251MA 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-AN251MA 2026": "abhirathi.sarkar@pw.live",
  "AN251MA": "aniket.mishra2@pw.live",
  "VIDYAPEETH 51-LJ151MA 2026": "abhirathi.sarkar@pw.live",
  "51-LJ151MA 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-LJ151MA 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-LJ151MA 2026": "abhirathi.sarkar@pw.live",
  "LJ151MA": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 51-LJ152MA 2026": "abhirathi.sarkar@pw.live",
  "51-LJ152MA 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-LJ152MA 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-LJ152MA 2026": "abhirathi.sarkar@pw.live",
  "LJ152MA": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 51-LJ153NA 2026": "anup.kumar2@pw.live",
  "51-LJ153NA 2026": "anup.kumar2@pw.live",
  "TUITION 51-LJ153NA 2026": "anup.kumar2@pw.live",
  "SIP 51-LJ153NA 2026": "anup.kumar2@pw.live",
  "LJ153NA": "anup.kumar2@pw.live",
  "VIDYAPEETH 51-LJ153MA 2026": "abhirathi.sarkar@pw.live",
  "51-LJ153MA 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-LJ153MA 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-LJ153MA 2026": "abhirathi.sarkar@pw.live",
  "LJ153MA": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 51-LJ154NA 2026": "anup.kumar2@pw.live",
  "51-LJ154NA 2026": "anup.kumar2@pw.live",
  "TUITION 51-LJ154NA 2026": "anup.kumar2@pw.live",
  "SIP 51-LJ154NA 2026": "anup.kumar2@pw.live",
  "LJ154NA": "anup.kumar2@pw.live",
  "VIDYAPEETH 51-LN151MA 2026": "abhirathi.sarkar@pw.live",
  "51-LN151MA 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-LN151MA 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-LN151MA 2026": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 51-LN152MA 2026": "abhirathi.sarkar@pw.live",
  "51-LN152MA 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-LN152MA 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-LN152MA 2026": "abhirathi.sarkar@pw.live",
  "LN152MA": "ashwini.kumar4@pw.live",
  "VIDYAPEETH 51-LN151NA 2026": "anup.kumar2@pw.live",
  "51-LN151NA 2026": "anup.kumar2@pw.live",
  "TUITION 51-LN151NA 2026": "anup.kumar2@pw.live",
  "SIP 51-LN151NA 2026": "anup.kumar2@pw.live",
  "VIDYAPEETH 51-LJ182MA 2026": "santosh.kumar5@pw.live",
  "51-LJ182MA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-LJ182MA 2026": "santosh.kumar5@pw.live",
  "SIP 51-LJ182MA 2026": "santosh.kumar5@pw.live",
  "LJ182MA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-LJ182NA 2026": "santosh.kumar5@pw.live",
  "51-LJ182NA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-LJ182NA 2026": "santosh.kumar5@pw.live",
  "SIP 51-LJ182NA 2026": "santosh.kumar5@pw.live",
  "LJ182NA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-LJ183MA 2026": "santosh.kumar5@pw.live",
  "51-LJ183MA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-LJ183MA 2026": "santosh.kumar5@pw.live",
  "SIP 51-LJ183MA 2026": "santosh.kumar5@pw.live",
  "LJ183MA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-LN182MA 2026": "santosh.kumar5@pw.live",
  "51-LN182MA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-LN182MA 2026": "santosh.kumar5@pw.live",
  "SIP 51-LN182MA 2026": "santosh.kumar5@pw.live",
  "LN182MA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 60-AJ102MA 2026": "sunita.wakle@pw.live",
  "60-AJ102MA 2026": "sunita.wakle@pw.live",
  "TUITION 60-AJ102MA 2026": "sunita.wakle@pw.live",
  "SIP 60-AJ102MA 2026": "sunita.wakle@pw.live",
  "AJ102MA": "sunita.wakle@pw.live",
  "VIDYAPEETH 60-AJ103MA 2026": "sunita.wakle@pw.live",
  "60-AJ103MA 2026": "sunita.wakle@pw.live",
  "TUITION 60-AJ103MA 2026": "sunita.wakle@pw.live",
  "SIP 60-AJ103MA 2026": "sunita.wakle@pw.live",
  "AJ103MA": "sunita.wakle@pw.live",
  "VIDYAPEETH 60-AJ104MA 2026": "aniket.gokhale@pw.live",
  "60-AJ104MA 2026": "aniket.gokhale@pw.live",
  "TUITION 60-AJ104MA 2026": "aniket.gokhale@pw.live",
  "SIP 60-AJ104MA 2026": "aniket.gokhale@pw.live",
  "AJ104MA": "aniket.gokhale@pw.live",
  "VIDYAPEETH 60-AJ105MA 2026": "aniket.gokhale@pw.live",
  "60-AJ105MA 2026": "aniket.gokhale@pw.live",
  "TUITION 60-AJ105MA 2026": "aniket.gokhale@pw.live",
  "SIP 60-AJ105MA 2026": "aniket.gokhale@pw.live",
  "AJ105MA": "aniket.gokhale@pw.live",
  "VIDYAPEETH 60-AJ107MA 2026": "syed.ali3@pw.live",
  "60-AJ107MA 2026": "syed.ali3@pw.live",
  "TUITION 60-AJ107MA 2026": "syed.ali3@pw.live",
  "SIP 60-AJ107MA 2026": "syed.ali3@pw.live",
  "AJ107MA": "syed.ali3@pw.live",
  "VIDYAPEETH 60-AJ106MA 2026": "syed.ali3@pw.live",
  "60-AJ106MA 2026": "syed.ali3@pw.live",
  "TUITION 60-AJ106MA 2026": "syed.ali3@pw.live",
  "SIP 60-AJ106MA 2026": "syed.ali3@pw.live",
  "AJ106MA": "syed.ali3@pw.live",
  "VIDYAPEETH 60-AJ202MA 2026": "syed.ali3@pw.live",
  "60-AJ202MA 2026": "syed.ali3@pw.live",
  "TUITION 60-AJ202MA 2026": "syed.ali3@pw.live",
  "SIP 60-AJ202MA 2026": "syed.ali3@pw.live",
  "VIDYAPEETH 60-AN201MA 2026": "syed.ali3@pw.live",
  "60-AN201MA 2026": "syed.ali3@pw.live",
  "TUITION 60-AN201MA 2026": "syed.ali3@pw.live",
  "SIP 60-AN201MA 2026": "syed.ali3@pw.live",
  "VIDYAPEETH 60-AN202MA 2026": "pawan.verma@pw.live",
  "60-AN202MA 2026": "pawan.verma@pw.live",
  "TUITION 60-AN202MA 2026": "pawan.verma@pw.live",
  "SIP 60-AN202MA 2026": "pawan.verma@pw.live",
  "VIDYAPEETH 60-LJ102NA 2026": "papender.kanwar@pw.live",
  "60-LJ102NA 2026": "papender.kanwar@pw.live",
  "TUITION 60-LJ102NA 2026": "papender.kanwar@pw.live",
  "SIP 60-LJ102NA 2026": "papender.kanwar@pw.live",
  "VIDYAPEETH 60-LJ103NA 2026": "pawan.verma@pw.live",
  "60-LJ103NA 2026": "pawan.verma@pw.live",
  "TUITION 60-LJ103NA 2026": "pawan.verma@pw.live",
  "SIP 60-LJ103NA 2026": "pawan.verma@pw.live",
  "VIDYAPEETH 60-LJ104NA 2026": "pawan.verma@pw.live",
  "60-LJ104NA 2026": "pawan.verma@pw.live",
  "TUITION 60-LJ104NA 2026": "pawan.verma@pw.live",
  "SIP 60-LJ104NA 2026": "pawan.verma@pw.live",
  "VIDYAPEETH 60-LJ105NA 2026": "pawan.verma@pw.live",
  "60-LJ105NA 2026": "pawan.verma@pw.live",
  "TUITION 60-LJ105NA 2026": "pawan.verma@pw.live",
  "SIP 60-LJ105NA 2026": "pawan.verma@pw.live",
  "VIDYAPEETH 60-LJ106NA 2026": "pawan.verma@pw.live",
  "60-LJ106NA 2026": "pawan.verma@pw.live",
  "TUITION 60-LJ106NA 2026": "pawan.verma@pw.live",
  "SIP 60-LJ106NA 2026": "pawan.verma@pw.live",
  "VIDYAPEETH 60-LJ107NA 2026": "pawan.verma@pw.live",
  "60-LJ107NA 2026": "pawan.verma@pw.live",
  "TUITION 60-LJ107NA 2026": "pawan.verma@pw.live",
  "SIP 60-LJ107NA 2026": "pawan.verma@pw.live",
  "VIDYAPEETH 60-LJ108NA 2026": "pawan.verma@pw.live",
  "60-LJ108NA 2026": "pawan.verma@pw.live",
  "TUITION 60-LJ108NA 2026": "pawan.verma@pw.live",
  "SIP 60-LJ108NA 2026": "pawan.verma@pw.live",
  "LJ108NA": "pawan.verma@pw.live",
  "VIDYAPEETH 60-LJ109NA 2026": "sunita.wakle@pw.live",
  "60-LJ109NA 2026": "sunita.wakle@pw.live",
  "TUITION 60-LJ109NA 2026": "sunita.wakle@pw.live",
  "SIP 60-LJ109NA 2026": "sunita.wakle@pw.live",
  "LJ109NA": "sunita.wakle@pw.live",
  "VIDYAPEETH 60-LN102NA 2026": "saurabh.tiwari3@pw.live",
  "60-LN102NA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 60-LN102NA 2026": "saurabh.tiwari3@pw.live",
  "SIP 60-LN102NA 2026": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 60-LN103NA 2026": "saurabh.tiwari3@pw.live",
  "60-LN103NA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 60-LN103NA 2026": "saurabh.tiwari3@pw.live",
  "SIP 60-LN103NA 2026": "saurabh.tiwari3@pw.live",
  "LN103NA": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 60-LN104NA 2026": "papender.kanwar@pw.live",
  "60-LN104NA 2026": "papender.kanwar@pw.live",
  "TUITION 60-LN104NA 2026": "papender.kanwar@pw.live",
  "SIP 60-LN104NA 2026": "papender.kanwar@pw.live",
  "LN104NA": "papender.kanwar@pw.live",
  "VIDYAPEETH 60-LN105NA 2026": "papender.kanwar@pw.live",
  "60-LN105NA 2026": "papender.kanwar@pw.live",
  "TUITION 60-LN105NA 2026": "papender.kanwar@pw.live",
  "SIP 60-LN105NA 2026": "papender.kanwar@pw.live",
  "LN105NA": "papender.kanwar@pw.live",
  "VIDYAPEETH 60-LN106NA 2026": "papender.kanwar@pw.live",
  "60-LN106NA 2026": "papender.kanwar@pw.live",
  "TUITION 60-LN106NA 2026": "papender.kanwar@pw.live",
  "SIP 60-LN106NA 2026": "papender.kanwar@pw.live",
  "LN106NA": "papender.kanwar@pw.live",
  "VIDYAPEETH 60-LN107NA 2026": "papender.kanwar@pw.live",
  "60-LN107NA 2026": "papender.kanwar@pw.live",
  "TUITION 60-LN107NA 2026": "papender.kanwar@pw.live",
  "SIP 60-LN107NA 2026": "papender.kanwar@pw.live",
  "LN107NA": "papender.kanwar@pw.live",
  "VIDYAPEETH 42-LM101NA 2026": "soniya.parmar@pw.live",
  "42-LM101NA 2026": "soniya.parmar@pw.live",
  "TUITION 42-LM101NA 2026": "soniya.parmar@pw.live",
  "SIP 42-LM101NA 2026": "soniya.parmar@pw.live",
  "VIDYAPEETH 42-UF201EA 2026": "soniya.parmar@pw.live",
  "42-UF201EA 2026": "soniya.parmar@pw.live",
  "TUITION 42-UF201EA 2026": "soniya.parmar@pw.live",
  "SIP 42-UF201EA 2026": "soniya.parmar@pw.live",
  "VIDYAPEETH 42-UP201EA 2026": "soniya.parmar@pw.live",
  "42-UP201EA 2026": "soniya.parmar@pw.live",
  "TUITION 42-UP201EA 2026": "soniya.parmar@pw.live",
  "SIP 42-UP201EA 2026": "soniya.parmar@pw.live",
  "VIDYAPEETH 61-AJ203MA 2026": "anil.kumar8@pw.live",
  "61-AJ203MA 2026": "anil.kumar8@pw.live",
  "TUITION 61-AJ203MA 2026": "anil.kumar8@pw.live",
  "SIP 61-AJ203MA 2026": "anil.kumar8@pw.live",
  "VIDYAPEETH 61-AJ201MA 2026": "anil.kumar8@pw.live",
  "61-AJ201MA 2026": "anil.kumar8@pw.live",
  "TUITION 61-AJ201MA 2026": "anil.kumar8@pw.live",
  "SIP 61-AJ201MA 2026": "anil.kumar8@pw.live",
  "VIDYAPEETH 61-AN302MA 2026": "sagar.gaud@pw.live",
  "61-AN302MA 2026": "sagar.gaud@pw.live",
  "TUITION 61-AN302MA 2026": "sagar.gaud@pw.live",
  "SIP 61-AN302MA 2026": "sagar.gaud@pw.live",
  "AN302MA": "sagar.gaud@pw.live",
  "VIDYAPEETH 61-LJ102NA 2026": "anil.kumar8@pw.live",
  "61-LJ102NA 2026": "anil.kumar8@pw.live",
  "TUITION 61-LJ102NA 2026": "anil.kumar8@pw.live",
  "SIP 61-LJ102NA 2026": "anil.kumar8@pw.live",
  "VIDYAPEETH 61-LJ103NA 2026": "anil.kumar8@pw.live",
  "61-LJ103NA 2026": "anil.kumar8@pw.live",
  "TUITION 61-LJ103NA 2026": "anil.kumar8@pw.live",
  "SIP 61-LJ103NA 2026": "anil.kumar8@pw.live",
  "VIDYAPEETH 61-LJ104MA 2026": "sagar.gaud@pw.live",
  "61-LJ104MA 2026": "sagar.gaud@pw.live",
  "TUITION 61-LJ104MA 2026": "sagar.gaud@pw.live",
  "SIP 61-LJ104MA 2026": "sagar.gaud@pw.live",
  "LJ104MA": "sagar.gaud@pw.live",
  "VIDYAPEETH 61-LJ105MA 2026": "sagar.gaud@pw.live",
  "61-LJ105MA 2026": "sagar.gaud@pw.live",
  "TUITION 61-LJ105MA 2026": "sagar.gaud@pw.live",
  "SIP 61-LJ105MA 2026": "sagar.gaud@pw.live",
  "LJ105MA": "sagar.gaud@pw.live",
  "VIDYAPEETH 61-LJ101NP 2026": "anil.kumar8@pw.live",
  "61-LJ101NP 2026": "anil.kumar8@pw.live",
  "TUITION 61-LJ101NP 2026": "anil.kumar8@pw.live",
  "SIP 61-LJ101NP 2026": "anil.kumar8@pw.live",
  "VIDYAPEETH 61-LN202NA 2026": "sagar.gaud@pw.live",
  "61-LN202NA 2026": "sagar.gaud@pw.live",
  "TUITION 61-LN202NA 2026": "sagar.gaud@pw.live",
  "SIP 61-LN202NA 2026": "sagar.gaud@pw.live",
  "LN202NA": "sagar.gaud@pw.live",
  "VIDYAPEETH 61-LN204MA 2026": "ankit.shrivastava@pw.live",
  "61-LN204MA 2026": "ankit.shrivastava@pw.live",
  "TUITION 61-LN204MA 2026": "ankit.shrivastava@pw.live",
  "SIP 61-LN204MA 2026": "ankit.shrivastava@pw.live",
  "LN204MA": "ankit.shrivastava@pw.live",
  "VIDYAPEETH 61-LN201MA 2026": "ankit.shrivastava@pw.live",
  "61-LN201MA 2026": "ankit.shrivastava@pw.live",
  "TUITION 61-LN201MA 2026": "ankit.shrivastava@pw.live",
  "SIP 61-LN201MA 2026": "ankit.shrivastava@pw.live",
  "VIDYAPEETH 61-LN101MP 2026": "ankit.shrivastava@pw.live",
  "61-LN101MP 2026": "ankit.shrivastava@pw.live",
  "TUITION 61-LN101MP 2026": "ankit.shrivastava@pw.live",
  "SIP 61-LN101MP 2026": "ankit.shrivastava@pw.live",
  "VIDYAPEETH 61-UF102EA 2026": "ankit.shrivastava@pw.live",
  "61-UF102EA 2026": "ankit.shrivastava@pw.live",
  "TUITION 61-UF102EA 2026": "ankit.shrivastava@pw.live",
  "SIP 61-UF102EA 2026": "ankit.shrivastava@pw.live",
  "UF102EA": "jyoti.sonawane@pw.live",
  "VIDYAPEETH 27-LJ101EA 2026": "prasad.shinde@pw.live",
  "27-LJ101EA 2026": "prasad.shinde@pw.live",
  "TUITION 27-LJ101EA 2026": "prasad.shinde@pw.live",
  "SIP 27-LJ101EA 2026": "prasad.shinde@pw.live",
  "VIDYAPEETH 27-AJ224MA 2026": "yuvraj.hada1@pw.live",
  "27-AJ224MA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-AJ224MA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-AJ224MA 2026": "yuvraj.hada1@pw.live",
  "AJ224MA": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 27-AJ222MA 2026": "yuvraj.hada1@pw.live",
  "27-AJ222MA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-AJ222MA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-AJ222MA 2026": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 27-AJ221MA 2026": "yuvraj.hada1@pw.live",
  "27-AJ221MA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-AJ221MA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-AJ221MA 2026": "yuvraj.hada1@pw.live",
  "AJ221MA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 27-LJ121EP 2026": "swapnil.jadhav@pw.live",
  "27-LJ121EP 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-LJ121EP 2026": "swapnil.jadhav@pw.live",
  "SIP 27-LJ121EP 2026": "swapnil.jadhav@pw.live",
  "LJ121EP": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 27-LJ221MA 2026": "yuvraj.hada1@pw.live",
  "27-LJ221MA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-LJ221MA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-LJ221MA 2026": "yuvraj.hada1@pw.live",
  "LJ221MA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 27-LJ222MA 2026": "swapnil.jadhav@pw.live",
  "27-LJ222MA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-LJ222MA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-LJ222MA 2026": "swapnil.jadhav@pw.live",
  "LJ222MA": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 27-LJ124MA 2026": "swapnil.jadhav@pw.live",
  "27-LJ124MA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-LJ124MA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-LJ124MA 2026": "swapnil.jadhav@pw.live",
  "LJ124MA": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 27-LJ125MA 2026": "swapnil.jadhav@pw.live",
  "27-LJ125MA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-LJ125MA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-LJ125MA 2026": "swapnil.jadhav@pw.live",
  "LJ125MA": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 27-LN121MP 2026": "yuvraj.hada1@pw.live",
  "27-LN121MP 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-LN121MP 2026": "yuvraj.hada1@pw.live",
  "SIP 27-LN121MP 2026": "yuvraj.hada1@pw.live",
  "LN121MP": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 27-LN222MA 2026": "swapnil.jadhav@pw.live",
  "27-LN222MA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-LN222MA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-LN222MA 2026": "swapnil.jadhav@pw.live",
  "LN222MA": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 27-UF122EA 2026": "yuvraj.hada1@pw.live",
  "27-UF122EA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-UF122EA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-UF122EA 2026": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 27-AJ261MA 2026": "kanchan.jaiswal@pw.live",
  "27-AJ261MA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-AJ261MA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-AJ261MA 2026": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 27-LJ262MA 2026": "kanchan.jaiswal@pw.live",
  "27-LJ262MA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-LJ262MA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-LJ262MA 2026": "kanchan.jaiswal@pw.live",
  "LJ262MA": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 27-AJ253MA 2026": "ashwini.kumar4@pw.live",
  "27-AJ253MA 2026": "ashwini.kumar4@pw.live",
  "TUITION 27-AJ253MA 2026": "ashwini.kumar4@pw.live",
  "SIP 27-AJ253MA 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH 27-AJ254MA 2026": "lavish.dhingra@pw.live",
  "27-AJ254MA 2026": "lavish.dhingra@pw.live",
  "TUITION 27-AJ254MA 2026": "lavish.dhingra@pw.live",
  "SIP 27-AJ254MA 2026": "lavish.dhingra@pw.live",
  "AJ254MA": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 27-AJ251MA 2026": "meenakshi.chauhan1@pw.live",
  "27-AJ251MA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-AJ251MA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-AJ251MA 2026": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 27-AN251MA 2026": "aniket.mishra2@pw.live",
  "27-AN251MA 2026": "aniket.mishra2@pw.live",
  "TUITION 27-AN251MA 2026": "aniket.mishra2@pw.live",
  "SIP 27-AN251MA 2026": "aniket.mishra2@pw.live",
  "VIDYAPEETH 27-LJ152EA 2026": "lavish.dhingra@pw.live",
  "27-LJ152EA 2026": "lavish.dhingra@pw.live",
  "TUITION 27-LJ152EA 2026": "lavish.dhingra@pw.live",
  "SIP 27-LJ152EA 2026": "lavish.dhingra@pw.live",
  "LJ152EA": "lavish.dhingra@pw.live",
  "VIDYAPEETH 27-LJ253MA 2026": "lavish.dhingra@pw.live",
  "27-LJ253MA 2026": "lavish.dhingra@pw.live",
  "TUITION 27-LJ253MA 2026": "lavish.dhingra@pw.live",
  "SIP 27-LJ253MA 2026": "lavish.dhingra@pw.live",
  "LJ253MA": "lavish.dhingra@pw.live",
  "VIDYAPEETH 27-LJ251MA 2026": "meenakshi.chauhan1@pw.live",
  "27-LJ251MA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-LJ251MA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-LJ251MA 2026": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 27-LN152MA 2026": "ashwini.kumar4@pw.live",
  "27-LN152MA 2026": "ashwini.kumar4@pw.live",
  "TUITION 27-LN152MA 2026": "ashwini.kumar4@pw.live",
  "SIP 27-LN152MA 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH 27-UF152EA 2026": "lavish.dhingra@pw.live",
  "27-UF152EA 2026": "lavish.dhingra@pw.live",
  "TUITION 27-UF152EA 2026": "lavish.dhingra@pw.live",
  "SIP 27-UF152EA 2026": "lavish.dhingra@pw.live",
  "UF152EA": "anup.kumar2@pw.live",
  "VIDYAPEETH 27-AJ271MA 2026": "nitish.kumar6@pw.live",
  "27-AJ271MA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-AJ271MA 2026": "nitish.kumar6@pw.live",
  "SIP 27-AJ271MA 2026": "nitish.kumar6@pw.live",
  "VIDYAPEETH 27-LJ171NP 2026": "nitish.kumar6@pw.live",
  "27-LJ171NP 2026": "nitish.kumar6@pw.live",
  "TUITION 27-LJ171NP 2026": "nitish.kumar6@pw.live",
  "SIP 27-LJ171NP 2026": "nitish.kumar6@pw.live",
  "LJ171NP": "nitish.kumar6@pw.live",
  "VIDYAPEETH 27-LJ272MA 2026": "nitish.kumar6@pw.live",
  "27-LJ272MA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-LJ272MA 2026": "nitish.kumar6@pw.live",
  "SIP 27-LJ272MA 2026": "nitish.kumar6@pw.live",
  "LJ272MA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 27-LJ173MA 2026": "nitish.kumar6@pw.live",
  "27-LJ173MA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-LJ173MA 2026": "nitish.kumar6@pw.live",
  "SIP 27-LJ173MA 2026": "nitish.kumar6@pw.live",
  "LJ173MA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 27-LJ174MA 2026 (MERGED)": "nitish.kumar6@pw.live",
  "27-LJ174MA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-LJ174MA 2026": "nitish.kumar6@pw.live",
  "VIDYAPEETH 27-LJ174MA 2026": "nitish.kumar6@pw.live",
  "SIP 27-LJ174MA 2026": "nitish.kumar6@pw.live",
  "LJ174MA2026MERGED": "nitish.kumar6@pw.live",
  "LJ174MA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 27-LN171NP 2026": "prasad.shinde@pw.live",
  "27-LN171NP 2026": "prasad.shinde@pw.live",
  "TUITION 27-LN171NP 2026": "prasad.shinde@pw.live",
  "SIP 27-LN171NP 2026": "prasad.shinde@pw.live",
  "LN171NP": "prasad.shinde@pw.live",
  "VIDYAPEETH 51-LJ272MA 2026": "muzamil.bhat@pw.live",
  "51-LJ272MA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-LJ272MA 2026": "muzamil.bhat@pw.live",
  "SIP 51-LJ272MA 2026": "muzamil.bhat@pw.live",
  "VIDYAPEETH 51-AJ254MA 2026": "abhirathi.sarkar@pw.live",
  "51-AJ254MA 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-AJ254MA 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-AJ254MA 2026": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 42-LJ201MA 2026": "soniya.parmar@pw.live",
  "42-LJ201MA 2026": "soniya.parmar@pw.live",
  "TUITION 42-LJ201MA 2026": "soniya.parmar@pw.live",
  "SIP 42-LJ201MA 2026": "soniya.parmar@pw.live",
  "TUITION T60-LJ11NA 2026": "papender.kanwar@pw.live",
  "T60-LJ11NA 2026": "papender.kanwar@pw.live",
  "VIDYAPEETH T60-LJ11NA 2026": "papender.kanwar@pw.live",
  "SIP T60-LJ11NA 2026": "papender.kanwar@pw.live",
  "LJ11NA": "papender.kanwar@pw.live",
  "TUITION T60-LJ12NA 2026": "papender.kanwar@pw.live",
  "T60-LJ12NA 2026": "papender.kanwar@pw.live",
  "VIDYAPEETH T60-LJ12NA 2026": "papender.kanwar@pw.live",
  "SIP T60-LJ12NA 2026": "papender.kanwar@pw.live",
  "LJ12NA": "papender.kanwar@pw.live",
  "TUITION T60-UF11EA 2026": "papender.kanwar@pw.live",
  "T60-UF11EA 2026": "papender.kanwar@pw.live",
  "VIDYAPEETH T60-UF11EA 2026": "papender.kanwar@pw.live",
  "SIP T60-UF11EA 2026": "papender.kanwar@pw.live",
  "UF11EA": "ashwini.kumar4@pw.live",
  "VIDYAPEETH 27-LJ122NA 2026": "swapnil.jadhav@pw.live",
  "27-LJ122NA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-LJ122NA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-LJ122NA 2026": "swapnil.jadhav@pw.live",
  "LJ122NA": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 27-LN221NA 2026": "swapnil.jadhav@pw.live",
  "27-LN221NA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-LN221NA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-LN221NA 2026": "swapnil.jadhav@pw.live",
  "LN221NA": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 27-NF151WA 2026": "meenakshi.chauhan1@pw.live",
  "27-NF151WA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-NF151WA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-NF151WA 2026": "meenakshi.chauhan1@pw.live",
  "NF151WA": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 27-UF271EA 2026": "nitish.kumar6@pw.live",
  "27-UF271EA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-UF271EA 2026": "nitish.kumar6@pw.live",
  "SIP 27-UF271EA 2026": "nitish.kumar6@pw.live",
  "UF271EA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 60-AN102MA 2026": "syed.ali3@pw.live",
  "60-AN102MA 2026": "syed.ali3@pw.live",
  "TUITION 60-AN102MA 2026": "syed.ali3@pw.live",
  "SIP 60-AN102MA 2026": "syed.ali3@pw.live",
  "AN102MA": "syed.ali3@pw.live",
  "VIDYAPEETH 60-LJ110NA 2026": "sunita.wakle@pw.live",
  "60-LJ110NA 2026": "sunita.wakle@pw.live",
  "TUITION 60-LJ110NA 2026": "sunita.wakle@pw.live",
  "SIP 60-LJ110NA 2026": "sunita.wakle@pw.live",
  "LJ110NA": "sunita.wakle@pw.live",
  "VIDYAPEETH 60-LJ111NA 2026": "sunita.wakle@pw.live",
  "60-LJ111NA 2026": "sunita.wakle@pw.live",
  "TUITION 60-LJ111NA 2026": "sunita.wakle@pw.live",
  "SIP 60-LJ111NA 2026": "sunita.wakle@pw.live",
  "LJ111NA": "sunita.wakle@pw.live",
  "VIDYAPEETH 60-LJ112NA 2026": "sunita.wakle@pw.live",
  "60-LJ112NA 2026": "sunita.wakle@pw.live",
  "TUITION 60-LJ112NA 2026": "sunita.wakle@pw.live",
  "SIP 60-LJ112NA 2026": "sunita.wakle@pw.live",
  "LJ112NA": "sunita.wakle@pw.live",
  "VIDYAPEETH 60-LJ113NA 2026": "sunita.wakle@pw.live",
  "60-LJ113NA 2026": "sunita.wakle@pw.live",
  "TUITION 60-LJ113NA 2026": "sunita.wakle@pw.live",
  "SIP 60-LJ113NA 2026": "sunita.wakle@pw.live",
  "LJ113NA": "sunita.wakle@pw.live",
  "VIDYAPEETH 60-LJ114NA 2026": "pawan.verma@pw.live",
  "60-LJ114NA 2026": "pawan.verma@pw.live",
  "TUITION 60-LJ114NA 2026": "pawan.verma@pw.live",
  "SIP 60-LJ114NA 2026": "pawan.verma@pw.live",
  "LJ114NA": "pawan.verma@pw.live",
  "VIDYAPEETH 60-LJ115NA 2026": "pawan.verma@pw.live",
  "60-LJ115NA 2026": "pawan.verma@pw.live",
  "TUITION 60-LJ115NA 2026": "pawan.verma@pw.live",
  "SIP 60-LJ115NA 2026": "pawan.verma@pw.live",
  "LJ115NA": "pawan.verma@pw.live",
  "VIDYAPEETH 60-LJ116NA 2026": "pawan.verma@pw.live",
  "60-LJ116NA 2026": "pawan.verma@pw.live",
  "TUITION 60-LJ116NA 2026": "pawan.verma@pw.live",
  "SIP 60-LJ116NA 2026": "pawan.verma@pw.live",
  "LJ116NA": "pawan.verma@pw.live",
  "VIDYAPEETH 60-LJ117NA 2026": "pawan.verma@pw.live",
  "60-LJ117NA 2026": "pawan.verma@pw.live",
  "TUITION 60-LJ117NA 2026": "pawan.verma@pw.live",
  "SIP 60-LJ117NA 2026": "pawan.verma@pw.live",
  "LJ117NA": "pawan.verma@pw.live",
  "VIDYAPEETH 27-UF151WA 2026": "lavish.dhingra@pw.live",
  "27-UF151WA 2026": "lavish.dhingra@pw.live",
  "TUITION 27-UF151WA 2026": "lavish.dhingra@pw.live",
  "SIP 27-UF151WA 2026": "lavish.dhingra@pw.live",
  "UF151WA": "lavish.dhingra@pw.live",
  "TUITION T60-LN11NA 2026": "papender.kanwar@pw.live",
  "T60-LN11NA 2026": "papender.kanwar@pw.live",
  "VIDYAPEETH T60-LN11NA 2026": "papender.kanwar@pw.live",
  "SIP T60-LN11NA 2026": "papender.kanwar@pw.live",
  "LN11NA": "papender.kanwar@pw.live",
  "TUITION T27-LJ11MA 2026": "ashwini.kumar4@pw.live",
  "T27-LJ11MA 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH T27-LJ11MA 2026": "ashwini.kumar4@pw.live",
  "SIP T27-LJ11MA 2026": "ashwini.kumar4@pw.live",
  "LJ11MA": "ashwini.kumar4@pw.live",
  "TUITION T27-LJ12MA 2026": "ashwini.kumar4@pw.live",
  "T27-LJ12MA 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH T27-LJ12MA 2026": "ashwini.kumar4@pw.live",
  "SIP T27-LJ12MA 2026": "ashwini.kumar4@pw.live",
  "LJ12MA": "ashwini.kumar4@pw.live",
  "TUITION T27-LN11MA 2026": "ashwini.kumar4@pw.live",
  "T27-LN11MA 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH T27-LN11MA 2026": "ashwini.kumar4@pw.live",
  "SIP T27-LN11MA 2026": "ashwini.kumar4@pw.live",
  "LN11MA": "ashwini.kumar4@pw.live",
  "VIDYAPEETH 27-LJ263MA 2026": "kanchan.jaiswal@pw.live",
  "27-LJ263MA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-LJ263MA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-LJ263MA 2026": "kanchan.jaiswal@pw.live",
  "LJ263MA": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 51-LN152NA 2026": "anup.kumar2@pw.live",
  "51-LN152NA 2026": "anup.kumar2@pw.live",
  "TUITION 51-LN152NA 2026": "anup.kumar2@pw.live",
  "SIP 51-LN152NA 2026": "anup.kumar2@pw.live",
  "LN152NA": "anup.kumar2@pw.live",
  "VIDYAPEETH 61-LJ107MA 2026": "anil.kumar8@pw.live",
  "61-LJ107MA 2026": "anil.kumar8@pw.live",
  "TUITION 61-LJ107MA 2026": "anil.kumar8@pw.live",
  "SIP 61-LJ107MA 2026": "anil.kumar8@pw.live",
  "LJ107MA": "anil.kumar8@pw.live",
  "VIDYAPEETH 27-LN153MA 2026": "lavish.dhingra@pw.live",
  "27-LN153MA 2026": "lavish.dhingra@pw.live",
  "TUITION 27-LN153MA 2026": "lavish.dhingra@pw.live",
  "SIP 27-LN153MA 2026": "lavish.dhingra@pw.live",
  "LN153MA": "lavish.dhingra@pw.live",
  "VIDYAPEETH 61-NF201ES 2026": "ankit.shrivastava@pw.live",
  "61-NF201ES 2026": "ankit.shrivastava@pw.live",
  "TUITION 61-NF201ES 2026": "ankit.shrivastava@pw.live",
  "SIP 61-NF201ES 2026": "ankit.shrivastava@pw.live",
  "VIDYAPEETH 61-UF201ES 2026": "sagar.gaud@pw.live",
  "61-UF201ES 2026": "sagar.gaud@pw.live",
  "TUITION 61-UF201ES 2026": "sagar.gaud@pw.live",
  "SIP 61-UF201ES 2026": "sagar.gaud@pw.live",
  "VIDYAPEETH 27-LJ161CP 2026": "aniket.kangude@pw.live",
  "27-LJ161CP 2026": "aniket.kangude@pw.live",
  "TUITION 27-LJ161CP 2026": "aniket.kangude@pw.live",
  "SIP 27-LJ161CP 2026": "aniket.kangude@pw.live",
  "LJ161CP": "aniket.kangude@pw.live",
  "VIDYAPEETH 69-UF102EA 2026": "kishor.gaikwad1@pw.live",
  "69-UF102EA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-UF102EA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-UF102EA 2026": "kishor.gaikwad1@pw.live",
  "VIDYAPEETH 42-UF201ES 2026": "soniya.parmar@pw.live",
  "42-UF201ES 2026": "soniya.parmar@pw.live",
  "TUITION 42-UF201ES 2026": "soniya.parmar@pw.live",
  "SIP 42-UF201ES 2026": "soniya.parmar@pw.live",
  "TUITION T51-AJ31MA 2026": "sakshi.bhardwaj@pw.live",
  "T51-AJ31MA 2026": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH T51-AJ31MA 2026": "sakshi.bhardwaj@pw.live",
  "SIP T51-AJ31MA 2026": "sakshi.bhardwaj@pw.live",
  "AJ31MA": "aniket.kangude@pw.live",
  "TUITION T51-AN31MA 2026": "sakshi.bhardwaj@pw.live",
  "T51-AN31MA 2026": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH T51-AN31MA 2026": "sakshi.bhardwaj@pw.live",
  "SIP T51-AN31MA 2026": "sakshi.bhardwaj@pw.live",
  "AN31MA": "aniket.kangude@pw.live",
  "TUITION T51-NF21EA 2026": "sakshi.bhardwaj@pw.live",
  "T51-NF21EA 2026": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH T51-NF21EA 2026": "sakshi.bhardwaj@pw.live",
  "SIP T51-NF21EA 2026": "sakshi.bhardwaj@pw.live",
  "NF21EA": "sakshi.bhardwaj@pw.live",
  "TUITION T51-NF22ES 2026": "sakshi.bhardwaj@pw.live",
  "T51-NF22ES 2026": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH T51-NF22ES 2026": "sakshi.bhardwaj@pw.live",
  "SIP T51-NF22ES 2026": "sakshi.bhardwaj@pw.live",
  "NF22ES": "sakshi.bhardwaj@pw.live",
  "TUITION T51-UF21EA 2026": "sakshi.bhardwaj@pw.live",
  "T51-UF21EA 2026": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH T51-UF21EA 2026": "sakshi.bhardwaj@pw.live",
  "SIP T51-UF21EA 2026": "sakshi.bhardwaj@pw.live",
  "UF21EA": "sakshi.bhardwaj@pw.live",
  "TUITION T51-UP21EA 2026": "sakshi.bhardwaj@pw.live",
  "T51-UP21EA 2026": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH T51-UP21EA 2026": "sakshi.bhardwaj@pw.live",
  "SIP T51-UP21EA 2026": "sakshi.bhardwaj@pw.live",
  "UP21EA": "ashwini.kumar4@pw.live",
  "TUITION T60-AJ21MA 2026": "syed.ali3@pw.live",
  "T60-AJ21MA 2026": "syed.ali3@pw.live",
  "VIDYAPEETH T60-AJ21MA 2026": "syed.ali3@pw.live",
  "SIP T60-AJ21MA 2026": "syed.ali3@pw.live",
  "AJ21MA": "syed.ali3@pw.live",
  "TUITION T60-AJ22MA 2026": "syed.ali3@pw.live",
  "T60-AJ22MA 2026": "syed.ali3@pw.live",
  "VIDYAPEETH T60-AJ22MA 2026": "syed.ali3@pw.live",
  "SIP T60-AJ22MA 2026": "syed.ali3@pw.live",
  "AJ22MA": "syed.ali3@pw.live",
  "TUITION T60-AN21MA 2026": "syed.ali3@pw.live",
  "T60-AN21MA 2026": "syed.ali3@pw.live",
  "VIDYAPEETH T60-AN21MA 2026": "syed.ali3@pw.live",
  "SIP T60-AN21MA 2026": "syed.ali3@pw.live",
  "AN21MA": "syed.ali3@pw.live",
  "TUITION T60-NF11EA 2026": "papender.kanwar@pw.live",
  "T60-NF11EA 2026": "papender.kanwar@pw.live",
  "VIDYAPEETH T60-NF11EA 2026": "papender.kanwar@pw.live",
  "SIP T60-NF11EA 2026": "papender.kanwar@pw.live",
  "NF11EA": "ashwini.kumar4@pw.live",
  "TUITION T60-NF14EA 2026": "papender.kanwar@pw.live",
  "T60-NF14EA 2026": "papender.kanwar@pw.live",
  "VIDYAPEETH T60-NF14EA 2026": "papender.kanwar@pw.live",
  "SIP T60-NF14EA 2026": "papender.kanwar@pw.live",
  "NF14EA": "papender.kanwar@pw.live",
  "TUITION T60-UF11ES 2026": "papender.kanwar@pw.live",
  "T60-UF11ES 2026": "papender.kanwar@pw.live",
  "VIDYAPEETH T60-UF11ES 2026": "papender.kanwar@pw.live",
  "SIP T60-UF11ES 2026": "papender.kanwar@pw.live",
  "UF11ES": "papender.kanwar@pw.live",
  "TUITION T60-UF14EA 2026": "papender.kanwar@pw.live",
  "T60-UF14EA 2026": "papender.kanwar@pw.live",
  "VIDYAPEETH T60-UF14EA 2026": "papender.kanwar@pw.live",
  "SIP T60-UF14EA 2026": "papender.kanwar@pw.live",
  "UF14EA": "papender.kanwar@pw.live",
  "TUITION T60-UP21EA 2026": "papender.kanwar@pw.live",
  "T60-UP21EA 2026": "papender.kanwar@pw.live",
  "VIDYAPEETH T60-UP21EA 2026": "papender.kanwar@pw.live",
  "SIP T60-UP21EA 2026": "papender.kanwar@pw.live",
  "TUITION T27-AJ11NA 2026": "ashwini.kumar4@pw.live",
  "T27-AJ11NA 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH T27-AJ11NA 2026": "ashwini.kumar4@pw.live",
  "SIP T27-AJ11NA 2026": "ashwini.kumar4@pw.live",
  "AJ11NA": "ashwini.kumar4@pw.live",
  "TUITION T27-NF11EA 2026": "ashwini.kumar4@pw.live",
  "T27-NF11EA 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH T27-NF11EA 2026": "ashwini.kumar4@pw.live",
  "SIP T27-NF11EA 2026": "ashwini.kumar4@pw.live",
  "TUITION T27-UF11EA 2026": "ashwini.kumar4@pw.live",
  "T27-UF11EA 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH T27-UF11EA 2026": "ashwini.kumar4@pw.live",
  "SIP T27-UF11EA 2026": "ashwini.kumar4@pw.live",
  "TUITION T27-UP21EI 2026": "ashwini.kumar4@pw.live",
  "T27-UP21EI 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH T27-UP21EI 2026": "ashwini.kumar4@pw.live",
  "SIP T27-UP21EI 2026": "ashwini.kumar4@pw.live",
  "UP21EI": "ashwini.kumar4@pw.live",
  "TUITION T27-UP21EA 2026": "ashwini.kumar4@pw.live",
  "T27-UP21EA 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH T27-UP21EA 2026": "ashwini.kumar4@pw.live",
  "SIP T27-UP21EA 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH 51-UF192EA 2026": "joyes.ashirwadam@pw.live",
  "51-UF192EA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-UF192EA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-UF192EA 2026": "joyes.ashirwadam@pw.live",
  "UF192EA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 60-UF102EA 2026": "sunita.wakle@pw.live",
  "60-UF102EA 2026": "sunita.wakle@pw.live",
  "TUITION 60-UF102EA 2026": "sunita.wakle@pw.live",
  "SIP 60-UF102EA 2026": "sunita.wakle@pw.live",
  "VIDYAPEETH 61-AN203MA 2026": "sagar.gaud@pw.live",
  "61-AN203MA 2026": "sagar.gaud@pw.live",
  "TUITION 61-AN203MA 2026": "sagar.gaud@pw.live",
  "SIP 61-AN203MA 2026": "sagar.gaud@pw.live",
  "AN203MA": "sagar.gaud@pw.live",
  "VIDYAPEETH 93-AJ211MA 2026": "vishal.rajput2@pw.live",
  "93-AJ211MA 2026": "vishal.rajput2@pw.live",
  "TUITION 93-AJ211MA 2026": "vishal.rajput2@pw.live",
  "SIP 93-AJ211MA 2026": "vishal.rajput2@pw.live",
  "AJ211MA": "vishal.rajput2@pw.live",
  "VIDYAPEETH 93-AN312MA 2026": "vishal.rajput2@pw.live",
  "93-AN312MA 2026": "vishal.rajput2@pw.live",
  "TUITION 93-AN312MA 2026": "vishal.rajput2@pw.live",
  "SIP 93-AN312MA 2026": "vishal.rajput2@pw.live",
  "AN312MA": "vishal.rajput2@pw.live",
  "VIDYAPEETH 93-LJ311MA 2026": "vishal.rajput2@pw.live",
  "93-LJ311MA 2026": "vishal.rajput2@pw.live",
  "TUITION 93-LJ311MA 2026": "vishal.rajput2@pw.live",
  "SIP 93-LJ311MA 2026": "vishal.rajput2@pw.live",
  "LJ311MA": "vishal.rajput2@pw.live",
  "VIDYAPEETH 93-NF211EA 2026": "manish.kumar11@pw.live",
  "93-NF211EA 2026": "manish.kumar11@pw.live",
  "TUITION 93-NF211EA 2026": "manish.kumar11@pw.live",
  "SIP 93-NF211EA 2026": "manish.kumar11@pw.live",
  "NF211EA": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 93-UP211EA 2026": "manish.kumar11@pw.live",
  "93-UP211EA 2026": "manish.kumar11@pw.live",
  "TUITION 93-UP211EA 2026": "manish.kumar11@pw.live",
  "SIP 93-UP211EA 2026": "manish.kumar11@pw.live",
  "UP211EA": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 93-AJ321EA 2026": "dipali.sonkamble@pw.live",
  "93-AJ321EA 2026": "dipali.sonkamble@pw.live",
  "TUITION 93-AJ321EA 2026": "dipali.sonkamble@pw.live",
  "SIP 93-AJ321EA 2026": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 93-AJ221MA 2026": "dipali.sonkamble@pw.live",
  "93-AJ221MA 2026": "dipali.sonkamble@pw.live",
  "TUITION 93-AJ221MA 2026": "dipali.sonkamble@pw.live",
  "SIP 93-AJ221MA 2026": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 93-AN221NA 2026": "dipali.sonkamble@pw.live",
  "93-AN221NA 2026": "dipali.sonkamble@pw.live",
  "TUITION 93-AN221NA 2026": "dipali.sonkamble@pw.live",
  "SIP 93-AN221NA 2026": "dipali.sonkamble@pw.live",
  "AN221NA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 93-LJ221MA 2026": "dipali.sonkamble@pw.live",
  "93-LJ221MA 2026": "dipali.sonkamble@pw.live",
  "TUITION 93-LJ221MA 2026": "dipali.sonkamble@pw.live",
  "SIP 93-LJ221MA 2026": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 93-NF221EA 2026": "joyes.ashirwadam@pw.live",
  "93-NF221EA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 93-NF221EA 2026": "joyes.ashirwadam@pw.live",
  "SIP 93-NF221EA 2026": "joyes.ashirwadam@pw.live",
  "NF221EA": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 93-NF221EI 2026": "joyes.ashirwadam@pw.live",
  "93-NF221EI 2026": "joyes.ashirwadam@pw.live",
  "TUITION 93-NF221EI 2026": "joyes.ashirwadam@pw.live",
  "SIP 93-NF221EI 2026": "joyes.ashirwadam@pw.live",
  "NF221EI": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 93-UF221EA 2026": "dipali.sonkamble@pw.live",
  "93-UF221EA 2026": "dipali.sonkamble@pw.live",
  "TUITION 93-UF221EA 2026": "dipali.sonkamble@pw.live",
  "SIP 93-UF221EA 2026": "dipali.sonkamble@pw.live",
  "UF221EA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 93-UF221EI 2026": "dipali.sonkamble@pw.live",
  "93-UF221EI 2026": "dipali.sonkamble@pw.live",
  "TUITION 93-UF221EI 2026": "dipali.sonkamble@pw.live",
  "SIP 93-UF221EI 2026": "dipali.sonkamble@pw.live",
  "UF221EI": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 93-UP221EA 2026": "muzamil.bhat@pw.live",
  "93-UP221EA 2026": "muzamil.bhat@pw.live",
  "TUITION 93-UP221EA 2026": "muzamil.bhat@pw.live",
  "SIP 93-UP221EA 2026": "muzamil.bhat@pw.live",
  "UP221EA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 94-AJ311EA 2026": "saurabh.tiwari3@pw.live",
  "94-AJ311EA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-AJ311EA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-AJ311EA 2026": "saurabh.tiwari3@pw.live",
  "AJ311EA": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 94-AN311EA 2026": "saurabh.tiwari3@pw.live",
  "94-AN311EA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-AN311EA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-AN311EA 2026": "saurabh.tiwari3@pw.live",
  "AN311EA": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 94-LJ311EA 2026": "saurabh.tiwari3@pw.live",
  "94-LJ311EA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-LJ311EA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-LJ311EA 2026": "saurabh.tiwari3@pw.live",
  "LJ311EA": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 94-LN311EA 2026": "saurabh.tiwari3@pw.live",
  "94-LN311EA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-LN311EA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-LN311EA 2026": "saurabh.tiwari3@pw.live",
  "LN311EA": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 94-NF211EA 2026": "saurabh.tiwari3@pw.live",
  "94-NF211EA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-NF211EA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-NF211EA 2026": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 94-UF211EA 2026": "saurabh.tiwari3@pw.live",
  "94-UF211EA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-UF211EA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-UF211EA 2026": "saurabh.tiwari3@pw.live",
  "UF211EA": "manish.kumar11@pw.live",
  "VIDYAPEETH 94-UP211EA 2026": "saurabh.tiwari3@pw.live",
  "94-UP211EA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-UP211EA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-UP211EA 2026": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 94-YN311MA 2026": "saurabh.tiwari3@pw.live",
  "94-YN311MA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-YN311MA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-YN311MA 2026": "saurabh.tiwari3@pw.live",
  "YN311MA": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 27-AN201EA 2026": "prasad.shinde@pw.live",
  "27-AN201EA 2026": "prasad.shinde@pw.live",
  "TUITION 27-AN201EA 2026": "prasad.shinde@pw.live",
  "SIP 27-AN201EA 2026": "prasad.shinde@pw.live",
  "AN201EA": "prasad.shinde@pw.live",
  "VIDYAPEETH 51-UF121ES 2026": "ruhi.maqbool@pw.live",
  "51-UF121ES 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-UF121ES 2026": "ruhi.maqbool@pw.live",
  "SIP 51-UF121ES 2026": "ruhi.maqbool@pw.live",
  "UF121ES": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 51-NF192EA 2026": "joyes.ashirwadam@pw.live",
  "51-NF192EA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-NF192EA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-NF192EA 2026": "joyes.ashirwadam@pw.live",
  "NF192EA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 60-NF102EA 2026": "sunita.wakle@pw.live",
  "60-NF102EA 2026": "sunita.wakle@pw.live",
  "TUITION 60-NF102EA 2026": "sunita.wakle@pw.live",
  "SIP 60-NF102EA 2026": "sunita.wakle@pw.live",
  "NF102EA": "sunita.wakle@pw.live",
  "SIP S41-LJ21MA 2026": "lavish.dhingra@pw.live",
  "S41-LJ21MA 2026": "lavish.dhingra@pw.live",
  "TUITION S41-LJ21MA 2026": "lavish.dhingra@pw.live",
  "VIDYAPEETH S41-LJ21MA 2026": "lavish.dhingra@pw.live",
  "LJ21MA": "lavish.dhingra@pw.live",
  "SIP S41-LN21MA 2026": "lavish.dhingra@pw.live",
  "S41-LN21MA 2026": "lavish.dhingra@pw.live",
  "TUITION S41-LN21MA 2026": "lavish.dhingra@pw.live",
  "VIDYAPEETH S41-LN21MA 2026": "lavish.dhingra@pw.live",
  "LN21MA": "lavish.dhingra@pw.live",
  "VIDYAPEETH 51-AJ281MA 2026": "santosh.kumar5@pw.live",
  "51-AJ281MA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-AJ281MA 2026": "santosh.kumar5@pw.live",
  "SIP 51-AJ281MA 2026": "santosh.kumar5@pw.live",
  "AJ281MA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-AJ481MA 2026": "santosh.kumar5@pw.live",
  "51-AJ481MA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-AJ481MA 2026": "santosh.kumar5@pw.live",
  "SIP 51-AJ481MA 2026": "santosh.kumar5@pw.live",
  "AJ481MA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 51-AJ381NA 2026": "santosh.kumar5@pw.live",
  "51-AJ381NA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-AJ381NA 2026": "santosh.kumar5@pw.live",
  "SIP 51-AJ381NA 2026": "santosh.kumar5@pw.live",
  "AJ381NA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 61-AJ204MA 2026": "sandeep.borase@pw.live",
  "61-AJ204MA 2026": "sandeep.borase@pw.live",
  "TUITION 61-AJ204MA 2026": "sandeep.borase@pw.live",
  "SIP 61-AJ204MA 2026": "sandeep.borase@pw.live",
  "VIDYAPEETH 51-UF132EA 2026": "dipali.sonkamble@pw.live",
  "51-UF132EA 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-UF132EA 2026": "dipali.sonkamble@pw.live",
  "SIP 51-UF132EA 2026": "dipali.sonkamble@pw.live",
  "UF132EA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 51-NF172EA 2026": "muzamil.bhat@pw.live",
  "51-NF172EA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-NF172EA 2026": "muzamil.bhat@pw.live",
  "SIP 51-NF172EA 2026": "muzamil.bhat@pw.live",
  "NF172EA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 60-NF201ES 2026": "sunita.wakle@pw.live",
  "60-NF201ES 2026": "sunita.wakle@pw.live",
  "TUITION 60-NF201ES 2026": "sunita.wakle@pw.live",
  "SIP 60-NF201ES 2026": "sunita.wakle@pw.live",
  "VIDYAPEETH 27-AJ201NA 2026": "prasad.shinde@pw.live",
  "27-AJ201NA 2026": "prasad.shinde@pw.live",
  "TUITION 27-AJ201NA 2026": "prasad.shinde@pw.live",
  "SIP 27-AJ201NA 2026": "prasad.shinde@pw.live",
  "TUITION T27-NF12EA 2026": "ashwini.kumar4@pw.live",
  "T27-NF12EA 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH T27-NF12EA 2026": "ashwini.kumar4@pw.live",
  "SIP T27-NF12EA 2026": "ashwini.kumar4@pw.live",
  "NF12EA": "ashwini.kumar4@pw.live",
  "VIDYAPEETH 69-AM301MA 2026": "kishor.gaikwad1@pw.live",
  "69-AM301MA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-AM301MA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-AM301MA 2026": "kishor.gaikwad1@pw.live",
  "AM301MA": "yogesh.bhalerao@pw.live",
  "VIDYAPEETH 51-AM223EA 2026": "ruhi.maqbool@pw.live",
  "51-AM223EA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-AM223EA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-AM223EA 2026": "ruhi.maqbool@pw.live",
  "AM223EA": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 1H-UF102EA 2026": "jyoti.sonawane@pw.live",
  "1H-UF102EA 2026": "jyoti.sonawane@pw.live",
  "TUITION 1H-UF102EA 2026": "jyoti.sonawane@pw.live",
  "SIP 1H-UF102EA 2026": "jyoti.sonawane@pw.live",
  "VIDYAPEETH 51-NF132EA 2026": "dipali.sonkamble@pw.live",
  "51-NF132EA 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-NF132EA 2026": "dipali.sonkamble@pw.live",
  "SIP 51-NF132EA 2026": "dipali.sonkamble@pw.live",
  "NF132EA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 60-AJ201MA 2026": "syed.ali3@pw.live",
  "60-AJ201MA 2026": "syed.ali3@pw.live",
  "TUITION 60-AJ201MA 2026": "syed.ali3@pw.live",
  "SIP 60-AJ201MA 2026": "syed.ali3@pw.live",
  "VIDYAPEETH 60-UF201EA 2026": "sunita.wakle@pw.live",
  "60-UF201EA 2026": "sunita.wakle@pw.live",
  "TUITION 60-UF201EA 2026": "sunita.wakle@pw.live",
  "SIP 60-UF201EA 2026": "sunita.wakle@pw.live",
  "VIDYAPEETH 60-UF201ES 2026": "sunita.wakle@pw.live",
  "60-UF201ES 2026": "sunita.wakle@pw.live",
  "TUITION 60-UF201ES 2026": "sunita.wakle@pw.live",
  "SIP 60-UF201ES 2026": "sunita.wakle@pw.live",
  "TUITION T27-UF12EA 2026": "ashwini.kumar4@pw.live",
  "T27-UF12EA 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH T27-UF12EA 2026": "ashwini.kumar4@pw.live",
  "SIP T27-UF12EA 2026": "ashwini.kumar4@pw.live",
  "UF12EA": "ashwini.kumar4@pw.live",
  "TUITION T27-NF21EI 2026": "ashwini.kumar4@pw.live",
  "T27-NF21EI 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH T27-NF21EI 2026": "ashwini.kumar4@pw.live",
  "SIP T27-NF21EI 2026": "ashwini.kumar4@pw.live",
  "NF21EI": "ashwini.kumar4@pw.live",
  "TUITION T27-UF21EI 2026": "ashwini.kumar4@pw.live",
  "T27-UF21EI 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH T27-UF21EI 2026": "ashwini.kumar4@pw.live",
  "SIP T27-UF21EI 2026": "ashwini.kumar4@pw.live",
  "UF21EI": "ashwini.kumar4@pw.live",
  "VIDYAPEETH 27-AJ252MA 2026": "meenakshi.chauhan1@pw.live",
  "27-AJ252MA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-AJ252MA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-AJ252MA 2026": "meenakshi.chauhan1@pw.live",
  "AJ252MA": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 27-AN471MA 2026": "prasad.shinde@pw.live",
  "27-AN471MA 2026": "prasad.shinde@pw.live",
  "TUITION 27-AN471MA 2026": "prasad.shinde@pw.live",
  "SIP 27-AN471MA 2026": "prasad.shinde@pw.live",
  "AN471MA": "prasad.shinde@pw.live",
  "VIDYAPEETH 36-AM303MA 2026": "ganesh.gavhane@pw.live",
  "36-AM303MA 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-AM303MA 2026": "ganesh.gavhane@pw.live",
  "SIP 36-AM303MA 2026": "ganesh.gavhane@pw.live",
  "AM303MA": "ganesh.gavhane@pw.live",
  "VIDYAPEETH 51-NF122EA 2026": "ruhi.maqbool@pw.live",
  "51-NF122EA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-NF122EA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-NF122EA 2026": "ruhi.maqbool@pw.live",
  "NF122EA": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 51-AJ291NA 2026": "joyes.ashirwadam@pw.live",
  "51-AJ291NA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-AJ291NA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-AJ291NA 2026": "joyes.ashirwadam@pw.live",
  "AJ291NA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 42-LJ101NP 2026": "anil.polkamwar@pw.live",
  "42-LJ101NP 2026": "anil.polkamwar@pw.live",
  "TUITION 42-LJ101NP 2026": "anil.polkamwar@pw.live",
  "SIP 42-LJ101NP 2026": "anil.polkamwar@pw.live",
  "VIDYAPEETH 42-LN101NP 2026": "anil.polkamwar@pw.live",
  "42-LN101NP 2026": "anil.polkamwar@pw.live",
  "TUITION 42-LN101NP 2026": "anil.polkamwar@pw.live",
  "SIP 42-LN101NP 2026": "anil.polkamwar@pw.live",
  "VIDYAPEETH 42-NF201EA 2026": "soniya.parmar@pw.live",
  "42-NF201EA 2026": "soniya.parmar@pw.live",
  "TUITION 42-NF201EA 2026": "soniya.parmar@pw.live",
  "SIP 42-NF201EA 2026": "soniya.parmar@pw.live",
  "VIDYAPEETH 27-AJ272MA 2026": "nitish.kumar6@pw.live",
  "27-AJ272MA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-AJ272MA 2026": "nitish.kumar6@pw.live",
  "SIP 27-AJ272MA 2026": "nitish.kumar6@pw.live",
  "VIDYAPEETH 27-AJ261CP 2026": "aniket.kangude@pw.live",
  "27-AJ261CP 2026": "aniket.kangude@pw.live",
  "TUITION 27-AJ261CP 2026": "aniket.kangude@pw.live",
  "SIP 27-AJ261CP 2026": "aniket.kangude@pw.live",
  "AJ261CP": "aniket.kangude@pw.live",
  "VIDYAPEETH 36-UF201EA 2026": "aarti.chalikwar@pw.live",
  "36-UF201EA 2026": "aarti.chalikwar@pw.live",
  "TUITION 36-UF201EA 2026": "aarti.chalikwar@pw.live",
  "SIP 36-UF201EA 2026": "aarti.chalikwar@pw.live",
  "VIDYAPEETH 51-AJ351MA 2026": "abhirathi.sarkar@pw.live",
  "51-AJ351MA 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-AJ351MA 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-AJ351MA 2026": "abhirathi.sarkar@pw.live",
  "AJ351MA": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 42-AJ401NA 2026": "jyoti.sonawane@pw.live",
  "42-AJ401NA 2026": "jyoti.sonawane@pw.live",
  "TUITION 42-AJ401NA 2026": "jyoti.sonawane@pw.live",
  "SIP 42-AJ401NA 2026": "jyoti.sonawane@pw.live",
  "AJ401NA": "anil.kumar8@pw.live",
  "VIDYAPEETH 1H-NF201EA 2026": "jyoti.sonawane@pw.live",
  "1H-NF201EA 2026": "jyoti.sonawane@pw.live",
  "TUITION 1H-NF201EA 2026": "jyoti.sonawane@pw.live",
  "SIP 1H-NF201EA 2026": "jyoti.sonawane@pw.live",
  "VIDYAPEETH 51-AJ321MA 2026": "anirban.das@pw.live",
  "51-AJ321MA 2026": "anirban.das@pw.live",
  "TUITION 51-AJ321MA 2026": "anirban.das@pw.live",
  "SIP 51-AJ321MA 2026": "anirban.das@pw.live",
  "AJ321MA": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 51-AJ201MA 2026": "sakshi.bhardwaj@pw.live",
  "51-AJ201MA 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-AJ201MA 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-AJ201MA 2026": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH 69-AJ302MA 2026": "kishor.gaikwad1@pw.live",
  "69-AJ302MA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-AJ302MA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-AJ302MA 2026": "kishor.gaikwad1@pw.live",
  "AJ302MA": "pawan.verma@pw.live",
  "VIDYAPEETH 36-AJ203MA 2026": "ganesh.gavhane@pw.live",
  "36-AJ203MA 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-AJ203MA 2026": "ganesh.gavhane@pw.live",
  "SIP 36-AJ203MA 2026": "ganesh.gavhane@pw.live",
  "VIDYAPEETH 93-UF211EA 2026": "manish.kumar11@pw.live",
  "93-UF211EA 2026": "manish.kumar11@pw.live",
  "TUITION 93-UF211EA 2026": "manish.kumar11@pw.live",
  "SIP 93-UF211EA 2026": "manish.kumar11@pw.live",
  "VIDYAPEETH 61-AN301MA 2026": "ankit.shrivastava@pw.live",
  "61-AN301MA 2026": "ankit.shrivastava@pw.live",
  "TUITION 61-AN301MA 2026": "ankit.shrivastava@pw.live",
  "SIP 61-AN301MA 2026": "ankit.shrivastava@pw.live",
  "VIDYAPEETH 60-AJ211MR 2026": "pawan.verma@pw.live",
  "60-AJ211MR 2026": "pawan.verma@pw.live",
  "TUITION 60-AJ211MR 2026": "pawan.verma@pw.live",
  "SIP 60-AJ211MR 2026": "pawan.verma@pw.live",
  "AJ211MR": "pawan.verma@pw.live",
  "VIDYAPEETH 60-AN211MR 2026": "pawan.verma@pw.live",
  "60-AN211MR 2026": "pawan.verma@pw.live",
  "TUITION 60-AN211MR 2026": "pawan.verma@pw.live",
  "SIP 60-AN211MR 2026": "pawan.verma@pw.live",
  "AN211MR": "pawan.verma@pw.live",
  "VIDYAPEETH 27-AJ351NA 2026": "meenakshi.chauhan1@pw.live",
  "27-AJ351NA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-AJ351NA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-AJ351NA 2026": "meenakshi.chauhan1@pw.live",
  "AJ351NA": "anup.kumar2@pw.live",
  "VIDYAPEETH 69-AN301MA 2026": "kishor.gaikwad1@pw.live",
  "69-AN301MA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-AN301MA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-AN301MA 2026": "kishor.gaikwad1@pw.live",
  "VIDYAPEETH 51-AJ371MA 2026": "muzamil.bhat@pw.live",
  "51-AJ371MA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-AJ371MA 2026": "muzamil.bhat@pw.live",
  "SIP 51-AJ371MA 2026": "muzamil.bhat@pw.live",
  "AJ371MA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 51-AJ322MA 2026": "anirban.das@pw.live",
  "51-AJ322MA 2026": "anirban.das@pw.live",
  "TUITION 51-AJ322MA 2026": "anirban.das@pw.live",
  "SIP 51-AJ322MA 2026": "anirban.das@pw.live",
  "AJ322MA": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 51-AN421MA 2026": "anirban.das@pw.live",
  "51-AN421MA 2026": "anirban.das@pw.live",
  "TUITION 51-AN421MA 2026": "anirban.das@pw.live",
  "SIP 51-AN421MA 2026": "anirban.das@pw.live",
  "AN421MA": "yuvraj.hada1@pw.live",
  "SIP S2J-AJ31MA 2026": "vivek.kumar19@pw.live",
  "S2J-AJ31MA 2026": "vivek.kumar19@pw.live",
  "TUITION S2J-AJ31MA 2026": "vivek.kumar19@pw.live",
  "VIDYAPEETH S2J-AJ31MA 2026": "vivek.kumar19@pw.live",
  "SIP S2J-AN31MA 2026": "vivek.kumar19@pw.live",
  "S2J-AN31MA 2026": "vivek.kumar19@pw.live",
  "TUITION S2J-AN31MA 2026": "vivek.kumar19@pw.live",
  "VIDYAPEETH S2J-AN31MA 2026": "vivek.kumar19@pw.live",
  "VIDYAPEETH 51-AM221EA 2026": "ruhi.maqbool@pw.live",
  "51-AM221EA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-AM221EA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-AM221EA 2026": "ruhi.maqbool@pw.live",
  "AM221EA": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 51-AJ351NA 2026": "anup.kumar2@pw.live",
  "51-AJ351NA 2026": "anup.kumar2@pw.live",
  "TUITION 51-AJ351NA 2026": "anup.kumar2@pw.live",
  "SIP 51-AJ351NA 2026": "anup.kumar2@pw.live",
  "VIDYAPEETH 27-AJ321MA 2026": "yuvraj.hada1@pw.live",
  "27-AJ321MA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-AJ321MA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-AJ321MA 2026": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 27-AN422MA 2026": "swapnil.jadhav@pw.live",
  "27-AN422MA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-AN422MA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-AN422MA 2026": "swapnil.jadhav@pw.live",
  "AN422MA": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 93-UP121EI 2026": "muzamil.bhat@pw.live",
  "93-UP121EI 2026": "muzamil.bhat@pw.live",
  "TUITION 93-UP121EI 2026": "muzamil.bhat@pw.live",
  "SIP 93-UP121EI 2026": "muzamil.bhat@pw.live",
  "UP121EI": "muzamil.bhat@pw.live",
  "VIDYAPEETH 27-LJ102NA 2026": "prasad.shinde@pw.live",
  "27-LJ102NA 2026": "prasad.shinde@pw.live",
  "TUITION 27-LJ102NA 2026": "prasad.shinde@pw.live",
  "SIP 27-LJ102NA 2026": "prasad.shinde@pw.live",
  "VIDYAPEETH 27-AJ351MA 2026": "meenakshi.chauhan1@pw.live",
  "27-AJ351MA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-AJ351MA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-AJ351MA 2026": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 36-AJ204MA 2026": "ganesh.gavhane@pw.live",
  "36-AJ204MA 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-AJ204MA 2026": "ganesh.gavhane@pw.live",
  "SIP 36-AJ204MA 2026": "ganesh.gavhane@pw.live",
  "VIDYAPEETH 51-LJ191NA 2026": "joyes.ashirwadam@pw.live",
  "51-LJ191NA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-LJ191NA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-LJ191NA 2026": "joyes.ashirwadam@pw.live",
  "LJ191NA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 61-AJ301NA 2026": "anil.kumar8@pw.live",
  "61-AJ301NA 2026": "anil.kumar8@pw.live",
  "TUITION 61-AJ301NA 2026": "anil.kumar8@pw.live",
  "SIP 61-AJ301NA 2026": "anil.kumar8@pw.live",
  "SIP S94-LJ31MA 2026": "aniket.kangude@pw.live",
  "S94-LJ31MA 2026": "aniket.kangude@pw.live",
  "TUITION S94-LJ31MA 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH S94-LJ31MA 2026": "aniket.kangude@pw.live",
  "LJ31MA": "aniket.kangude@pw.live",
  "SIP S94-NF21MA 2026": "aniket.kangude@pw.live",
  "S94-NF21MA 2026": "aniket.kangude@pw.live",
  "TUITION S94-NF21MA 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH S94-NF21MA 2026": "aniket.kangude@pw.live",
  "NF21MA": "aarti.chalikwar@pw.live",
  "SIP S94-UF21MA 2026": "aniket.kangude@pw.live",
  "S94-UF21MA 2026": "aniket.kangude@pw.live",
  "TUITION S94-UF21MA 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH S94-UF21MA 2026": "aniket.kangude@pw.live",
  "UF21MA": "aniket.kangude@pw.live",
  "SIP S94-UP21MA 2026": "aniket.kangude@pw.live",
  "S94-UP21MA 2026": "aniket.kangude@pw.live",
  "TUITION S94-UP21MA 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH S94-UP21MA 2026": "aniket.kangude@pw.live",
  "UP21MA": "vishal.rajput2@pw.live",
  "TUITION T60-AJ31MA 2026": "syed.ali3@pw.live",
  "T60-AJ31MA 2026": "syed.ali3@pw.live",
  "VIDYAPEETH T60-AJ31MA 2026": "syed.ali3@pw.live",
  "SIP T60-AJ31MA 2026": "syed.ali3@pw.live",
  "TUITION T27-AJ31NA 2026": "ashwini.kumar4@pw.live",
  "T27-AJ31NA 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH T27-AJ31NA 2026": "ashwini.kumar4@pw.live",
  "SIP T27-AJ31NA 2026": "ashwini.kumar4@pw.live",
  "AJ31NA": "ashwini.kumar4@pw.live",
  "TUITION T27-AN31NA 2026": "ashwini.kumar4@pw.live",
  "T27-AN31NA 2026": "ashwini.kumar4@pw.live",
  "VIDYAPEETH T27-AN31NA 2026": "ashwini.kumar4@pw.live",
  "SIP T27-AN31NA 2026": "ashwini.kumar4@pw.live",
  "AN31NA": "ashwini.kumar4@pw.live",
  "VIDYAPEETH 51-UF131CP 2026": "dipali.sonkamble@pw.live",
  "51-UF131CP 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-UF131CP 2026": "dipali.sonkamble@pw.live",
  "SIP 51-UF131CP 2026": "dipali.sonkamble@pw.live",
  "UF131CP": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 60-AJ301MA 2026": "pawan.verma@pw.live",
  "60-AJ301MA 2026": "pawan.verma@pw.live",
  "TUITION 60-AJ301MA 2026": "pawan.verma@pw.live",
  "SIP 60-AJ301MA 2026": "pawan.verma@pw.live",
  "AJ301MA": "kishor.gaikwad1@pw.live",
  "VIDYAPEETH 51-AJ421NA 2026": "anirban.das@pw.live",
  "51-AJ421NA 2026": "anirban.das@pw.live",
  "TUITION 51-AJ421NA 2026": "anirban.das@pw.live",
  "SIP 51-AJ421NA 2026": "anirban.das@pw.live",
  "VIDYAPEETH 51-AJ471NA 2026": "joyes.ashirwadam@pw.live",
  "51-AJ471NA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-AJ471NA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-AJ471NA 2026": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 51-AN471NA 2026": "joyes.ashirwadam@pw.live",
  "51-AN471NA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-AN471NA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-AN471NA 2026": "joyes.ashirwadam@pw.live",
  "AN471NA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 27-AJ322MA 2026": "yuvraj.hada1@pw.live",
  "27-AJ322MA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-AJ322MA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-AJ322MA 2026": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 27-AJ371MA 2026": "nitish.kumar6@pw.live",
  "27-AJ371MA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-AJ371MA 2026": "nitish.kumar6@pw.live",
  "SIP 27-AJ371MA 2026": "nitish.kumar6@pw.live",
  "VIDYAPEETH 93-AJ411MA 2026": "vishal.rajput2@pw.live",
  "93-AJ411MA 2026": "vishal.rajput2@pw.live",
  "TUITION 93-AJ411MA 2026": "vishal.rajput2@pw.live",
  "SIP 93-AJ411MA 2026": "vishal.rajput2@pw.live",
  "AJ411MA": "vishal.rajput2@pw.live",
  "VIDYAPEETH 27-AN351MA 2026": "ashwini.kumar4@pw.live",
  "27-AN351MA 2026": "ashwini.kumar4@pw.live",
  "TUITION 27-AN351MA 2026": "ashwini.kumar4@pw.live",
  "SIP 27-AN351MA 2026": "ashwini.kumar4@pw.live",
  "AN351MA": "ashwini.kumar4@pw.live",
  "VIDYAPEETH 36-AJ301MA 2026": "aarti.chalikwar@pw.live",
  "36-AJ301MA 2026": "aarti.chalikwar@pw.live",
  "TUITION 36-AJ301MA 2026": "aarti.chalikwar@pw.live",
  "SIP 36-AJ301MA 2026": "aarti.chalikwar@pw.live",
  "VIDYAPEETH 36-AN301MA 2026": "ganesh.gavhane@pw.live",
  "36-AN301MA 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-AN301MA 2026": "ganesh.gavhane@pw.live",
  "SIP 36-AN301MA 2026": "ganesh.gavhane@pw.live",
  "VIDYAPEETH 1H-YN401MA 2026": "jyoti.sonawane@pw.live",
  "1H-YN401MA 2026": "jyoti.sonawane@pw.live",
  "TUITION 1H-YN401MA 2026": "jyoti.sonawane@pw.live",
  "SIP 1H-YN401MA 2026": "jyoti.sonawane@pw.live",
  "YN401MA": "sunita.wakle@pw.live",
  "VIDYAPEETH 60-AJ302MA 2026": "pawan.verma@pw.live",
  "60-AJ302MA 2026": "pawan.verma@pw.live",
  "TUITION 60-AJ302MA 2026": "pawan.verma@pw.live",
  "SIP 60-AJ302MA 2026": "pawan.verma@pw.live",
  "VIDYAPEETH 27-LJ161NA 2026": "kanchan.jaiswal@pw.live",
  "27-LJ161NA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-LJ161NA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-LJ161NA 2026": "kanchan.jaiswal@pw.live",
  "LJ161NA": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 27-LN262NA 2026": "kanchan.jaiswal@pw.live",
  "27-LN262NA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-LN262NA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-LN262NA 2026": "kanchan.jaiswal@pw.live",
  "LN262NA": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 51-AJ352NA 2026": "abhirathi.sarkar@pw.live",
  "51-AJ352NA 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-AJ352NA 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-AJ352NA 2026": "abhirathi.sarkar@pw.live",
  "AJ352NA": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 27-AN461EA 2026": "kanchan.jaiswal@pw.live",
  "27-AN461EA 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-AN461EA 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-AN461EA 2026": "kanchan.jaiswal@pw.live",
  "AN461EA": "kanchan.jaiswal@pw.live",
  "SIP S84-AJ51MA 2026": "aniket.gokhale@pw.live",
  "S84-AJ51MA 2026": "aniket.gokhale@pw.live",
  "TUITION S84-AJ51MA 2026": "aniket.gokhale@pw.live",
  "VIDYAPEETH S84-AJ51MA 2026": "aniket.gokhale@pw.live",
  "AJ51MA": "aniket.kangude@pw.live",
  "SIP S84-AN51MA 2026": "aniket.gokhale@pw.live",
  "S84-AN51MA 2026": "aniket.gokhale@pw.live",
  "TUITION S84-AN51MA 2026": "aniket.gokhale@pw.live",
  "VIDYAPEETH S84-AN51MA 2026": "aniket.gokhale@pw.live",
  "AN51MA": "aniket.kangude@pw.live",
  "SIP S84-LJ31WA 2026": "aniket.gokhale@pw.live",
  "S84-LJ31WA 2026": "aniket.gokhale@pw.live",
  "TUITION S84-LJ31WA 2026": "aniket.gokhale@pw.live",
  "VIDYAPEETH S84-LJ31WA 2026": "aniket.gokhale@pw.live",
  "LJ31WA": "aniket.kangude@pw.live",
  "SIP S84-LN31WA 2026": "aniket.gokhale@pw.live",
  "S84-LN31WA 2026": "aniket.gokhale@pw.live",
  "TUITION S84-LN31WA 2026": "aniket.gokhale@pw.live",
  "VIDYAPEETH S84-LN31WA 2026": "aniket.gokhale@pw.live",
  "LN31WA": "aniket.kangude@pw.live",
  "SIP S81-AJ51MA 2026": "aniket.kangude@pw.live",
  "S81-AJ51MA 2026": "aniket.kangude@pw.live",
  "TUITION S81-AJ51MA 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH S81-AJ51MA 2026": "aniket.kangude@pw.live",
  "SIP S81-AN51MA 2026": "aniket.kangude@pw.live",
  "S81-AN51MA 2026": "aniket.kangude@pw.live",
  "TUITION S81-AN51MA 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH S81-AN51MA 2026": "aniket.kangude@pw.live",
  "SIP S81-LJ31WA 2026": "aniket.kangude@pw.live",
  "S81-LJ31WA 2026": "aniket.kangude@pw.live",
  "TUITION S81-LJ31WA 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH S81-LJ31WA 2026": "aniket.kangude@pw.live",
  "SIP S81-LN31WA 2026": "aniket.kangude@pw.live",
  "S81-LN31WA 2026": "aniket.kangude@pw.live",
  "TUITION S81-LN31WA 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH S81-LN31WA 2026": "aniket.kangude@pw.live",
  "SIP S41-AJ31MA 2026": "lavish.dhingra@pw.live",
  "S41-AJ31MA 2026": "lavish.dhingra@pw.live",
  "TUITION S41-AJ31MA 2026": "lavish.dhingra@pw.live",
  "VIDYAPEETH S41-AJ31MA 2026": "lavish.dhingra@pw.live",
  "SIP S41-AN31MA 2026": "lavish.dhingra@pw.live",
  "S41-AN31MA 2026": "lavish.dhingra@pw.live",
  "TUITION S41-AN31MA 2026": "lavish.dhingra@pw.live",
  "VIDYAPEETH S41-AN31MA 2026": "lavish.dhingra@pw.live",
  "SIP S41-NF31EA 2026": "lavish.dhingra@pw.live",
  "S41-NF31EA 2026": "lavish.dhingra@pw.live",
  "TUITION S41-NF31EA 2026": "lavish.dhingra@pw.live",
  "VIDYAPEETH S41-NF31EA 2026": "lavish.dhingra@pw.live",
  "NF31EA": "lavish.dhingra@pw.live",
  "SIP S41-UF31EA 2026": "lavish.dhingra@pw.live",
  "S41-UF31EA 2026": "lavish.dhingra@pw.live",
  "TUITION S41-UF31EA 2026": "lavish.dhingra@pw.live",
  "VIDYAPEETH S41-UF31EA 2026": "lavish.dhingra@pw.live",
  "UF31EA": "lavish.dhingra@pw.live",
  "SIP S41-UP31EA 2026": "lavish.dhingra@pw.live",
  "S41-UP31EA 2026": "lavish.dhingra@pw.live",
  "TUITION S41-UP31EA 2026": "lavish.dhingra@pw.live",
  "VIDYAPEETH S41-UP31EA 2026": "lavish.dhingra@pw.live",
  "UP31EA": "lavish.dhingra@pw.live",
  "VIDYAPEETH 51-YN481NA 2026": "santosh.kumar5@pw.live",
  "51-YN481NA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-YN481NA 2026": "santosh.kumar5@pw.live",
  "SIP 51-YN481NA 2026": "santosh.kumar5@pw.live",
  "YN481NA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 69-AJ301MA 2026": "kishor.gaikwad1@pw.live",
  "69-AJ301MA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-AJ301MA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-AJ301MA 2026": "kishor.gaikwad1@pw.live",
  "VIDYAPEETH 51-AN481NA 2026": "santosh.kumar5@pw.live",
  "51-AN481NA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-AN481NA 2026": "santosh.kumar5@pw.live",
  "SIP 51-AN481NA 2026": "santosh.kumar5@pw.live",
  "AN481NA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 61-AM301NA 2026": "ankit.shrivastava@pw.live",
  "61-AM301NA 2026": "ankit.shrivastava@pw.live",
  "TUITION 61-AM301NA 2026": "ankit.shrivastava@pw.live",
  "SIP 61-AM301NA 2026": "ankit.shrivastava@pw.live",
  "AM301NA": "ankit.shrivastava@pw.live",
  "VIDYAPEETH 27-AN421MA 2026": "yuvraj.hada1@pw.live",
  "27-AN421MA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-AN421MA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-AN421MA 2026": "yuvraj.hada1@pw.live",
  "SIP S09-NF21MA 2026": "aarti.chalikwar@pw.live",
  "S09-NF21MA 2026": "aarti.chalikwar@pw.live",
  "TUITION S09-NF21MA 2026": "aarti.chalikwar@pw.live",
  "VIDYAPEETH S09-NF21MA 2026": "aarti.chalikwar@pw.live",
  "SIP S09-NF22MA 2026": "yogesh.bhalerao@pw.live",
  "S09-NF22MA 2026": "yogesh.bhalerao@pw.live",
  "TUITION S09-NF22MA 2026": "yogesh.bhalerao@pw.live",
  "VIDYAPEETH S09-NF22MA 2026": "yogesh.bhalerao@pw.live",
  "NF22MA": "yogesh.bhalerao@pw.live",
  "SIP S09-NF23MA 2026": "yogesh.bhalerao@pw.live",
  "S09-NF23MA 2026": "yogesh.bhalerao@pw.live",
  "TUITION S09-NF23MA 2026": "yogesh.bhalerao@pw.live",
  "VIDYAPEETH S09-NF23MA 2026": "yogesh.bhalerao@pw.live",
  "NF23MA": "yogesh.bhalerao@pw.live",
  "SIP S09-UF21MA 2026": "aniket.kangude@pw.live",
  "S09-UF21MA 2026": "aniket.kangude@pw.live",
  "TUITION S09-UF21MA 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH S09-UF21MA 2026": "aniket.kangude@pw.live",
  "SIP S09-UF22MA 2026": "aniket.kangude@pw.live",
  "S09-UF22MA 2026": "aniket.kangude@pw.live",
  "TUITION S09-UF22MA 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH S09-UF22MA 2026": "aniket.kangude@pw.live",
  "UF22MA": "aniket.kangude@pw.live",
  "SIP S09-UF23MA 2026": "anil.polkamwar@pw.live",
  "S09-UF23MA 2026": "anil.polkamwar@pw.live",
  "TUITION S09-UF23MA 2026": "anil.polkamwar@pw.live",
  "VIDYAPEETH S09-UF23MA 2026": "anil.polkamwar@pw.live",
  "UF23MA": "anil.polkamwar@pw.live",
  "SIP S09-UP21MA 2026": "vishal.rajput2@pw.live",
  "S09-UP21MA 2026": "vishal.rajput2@pw.live",
  "TUITION S09-UP21MA 2026": "vishal.rajput2@pw.live",
  "VIDYAPEETH S09-UP21MA 2026": "vishal.rajput2@pw.live",
  "SIP S09-UP22MA 2026": "aniket.kangude@pw.live",
  "S09-UP22MA 2026": "aniket.kangude@pw.live",
  "TUITION S09-UP22MA 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH S09-UP22MA 2026": "aniket.kangude@pw.live",
  "UP22MA": "aniket.kangude@pw.live",
  "SIP S09-UP23MA 2026": "niraj.verma2@pw.live",
  "S09-UP23MA 2026": "niraj.verma2@pw.live",
  "TUITION S09-UP23MA 2026": "niraj.verma2@pw.live",
  "VIDYAPEETH S09-UP23MA 2026": "niraj.verma2@pw.live",
  "UP23MA": "niraj.verma2@pw.live",
  "VIDYAPEETH 51-AJ471MA 2026": "vivek.kumar19@pw.live",
  "51-AJ471MA 2026": "vivek.kumar19@pw.live",
  "TUITION 51-AJ471MA 2026": "vivek.kumar19@pw.live",
  "SIP 51-AJ471MA 2026": "vivek.kumar19@pw.live",
  "AJ471MA": "vivek.kumar19@pw.live",
  "VIDYAPEETH 27-AJ451NA 2026": "meenakshi.chauhan1@pw.live",
  "27-AJ451NA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-AJ451NA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-AJ451NA 2026": "meenakshi.chauhan1@pw.live",
  "AJ451NA": "anup.kumar2@pw.live",
  "VIDYAPEETH 93-AN411MA 2026": "vishal.rajput2@pw.live",
  "93-AN411MA 2026": "vishal.rajput2@pw.live",
  "TUITION 93-AN411MA 2026": "vishal.rajput2@pw.live",
  "SIP 93-AN411MA 2026": "vishal.rajput2@pw.live",
  "AN411MA": "vishal.rajput2@pw.live",
  "VIDYAPEETH 27-AJ421MA 2026": "swapnil.jadhav@pw.live",
  "27-AJ421MA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-AJ421MA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-AJ421MA 2026": "swapnil.jadhav@pw.live",
  "AJ421MA": "anirban.das@pw.live",
  "VIDYAPEETH 51-AJ421MA 2026": "anirban.das@pw.live",
  "51-AJ421MA 2026": "anirban.das@pw.live",
  "TUITION 51-AJ421MA 2026": "anirban.das@pw.live",
  "SIP 51-AJ421MA 2026": "anirban.das@pw.live",
  "VIDYAPEETH 51-AJ491MA 2026": "muzamil.bhat@pw.live",
  "51-AJ491MA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-AJ491MA 2026": "muzamil.bhat@pw.live",
  "SIP 51-AJ491MA 2026": "muzamil.bhat@pw.live",
  "AJ491MA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 60-AJ411NR 2026": "pawan.verma@pw.live",
  "60-AJ411NR 2026": "pawan.verma@pw.live",
  "TUITION 60-AJ411NR 2026": "pawan.verma@pw.live",
  "SIP 60-AJ411NR 2026": "pawan.verma@pw.live",
  "AJ411NR": "pawan.verma@pw.live",
  "VIDYAPEETH 60-YN411NR 2026": "pawan.verma@pw.live",
  "60-YN411NR 2026": "pawan.verma@pw.live",
  "TUITION 60-YN411NR 2026": "pawan.verma@pw.live",
  "SIP 60-YN411NR 2026": "pawan.verma@pw.live",
  "YN411NR": "pawan.verma@pw.live",
  "VIDYAPEETH 27-NF221EA 2026": "yuvraj.hada1@pw.live",
  "27-NF221EA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-NF221EA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-NF221EA 2026": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 51-AN491NA 2026": "joyes.ashirwadam@pw.live",
  "51-AN491NA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-AN491NA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-AN491NA 2026": "joyes.ashirwadam@pw.live",
  "AN491NA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 60-AJ401MA 2026": "aniket.gokhale@pw.live",
  "60-AJ401MA 2026": "aniket.gokhale@pw.live",
  "TUITION 60-AJ401MA 2026": "aniket.gokhale@pw.live",
  "SIP 60-AJ401MA 2026": "aniket.gokhale@pw.live",
  "AJ401MA": "jyoti.sonawane@pw.live",
  "VIDYAPEETH 60-AN401MA 2026": "syed.ali3@pw.live",
  "60-AN401MA 2026": "syed.ali3@pw.live",
  "TUITION 60-AN401MA 2026": "syed.ali3@pw.live",
  "SIP 60-AN401MA 2026": "syed.ali3@pw.live",
  "AN401MA": "syed.ali3@pw.live",
  "VIDYAPEETH 60-YN401MA 2026": "sunita.wakle@pw.live",
  "60-YN401MA 2026": "sunita.wakle@pw.live",
  "TUITION 60-YN401MA 2026": "sunita.wakle@pw.live",
  "SIP 60-YN401MA 2026": "sunita.wakle@pw.live",
  "VIDYAPEETH 69-NR101EA 2026": "kishor.gaikwad1@pw.live",
  "69-NR101EA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-NR101EA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-NR101EA 2026": "kishor.gaikwad1@pw.live",
  "NR101EA": "sandeep.borase@pw.live",
  "VIDYAPEETH 69-UR101EA 2026": "kishor.gaikwad1@pw.live",
  "69-UR101EA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-UR101EA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-UR101EA 2026": "kishor.gaikwad1@pw.live",
  "UR101EA": "sandeep.borase@pw.live",
  "VIDYAPEETH 36-NR101EA 2026": "yogesh.bhalerao@pw.live",
  "36-NR101EA 2026": "yogesh.bhalerao@pw.live",
  "TUITION 36-NR101EA 2026": "yogesh.bhalerao@pw.live",
  "SIP 36-NR101EA 2026": "yogesh.bhalerao@pw.live",
  "VIDYAPEETH 36-UR101EA 2026": "yogesh.bhalerao@pw.live",
  "36-UR101EA 2026": "yogesh.bhalerao@pw.live",
  "TUITION 36-UR101EA 2026": "yogesh.bhalerao@pw.live",
  "SIP 36-UR101EA 2026": "yogesh.bhalerao@pw.live",
  "VIDYAPEETH 51-NR121EA 2026": "ruhi.maqbool@pw.live",
  "51-NR121EA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-NR121EA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-NR121EA 2026": "ruhi.maqbool@pw.live",
  "NR121EA": "aniket.kangude@pw.live",
  "VIDYAPEETH 51-NR151EA 2026": "aniket.kangude@pw.live",
  "51-NR151EA 2026": "aniket.kangude@pw.live",
  "TUITION 51-NR151EA 2026": "aniket.kangude@pw.live",
  "SIP 51-NR151EA 2026": "aniket.kangude@pw.live",
  "NR151EA": "aniket.mishra2@pw.live",
  "VIDYAPEETH 51-UR151EA 2026": "aniket.kangude@pw.live",
  "51-UR151EA 2026": "aniket.kangude@pw.live",
  "TUITION 51-UR151EA 2026": "aniket.kangude@pw.live",
  "SIP 51-UR151EA 2026": "aniket.kangude@pw.live",
  "UR151EA": "aniket.mishra2@pw.live",
  "VIDYAPEETH 51-UR181EA 2026": "santosh.kumar5@pw.live",
  "51-UR181EA 2026": "santosh.kumar5@pw.live",
  "TUITION 51-UR181EA 2026": "santosh.kumar5@pw.live",
  "SIP 51-UR181EA 2026": "santosh.kumar5@pw.live",
  "UR181EA": "santosh.kumar5@pw.live",
  "VIDYAPEETH 60-UR101EA 2026": "aniket.gokhale@pw.live",
  "60-UR101EA 2026": "aniket.gokhale@pw.live",
  "TUITION 60-UR101EA 2026": "aniket.gokhale@pw.live",
  "SIP 60-UR101EA 2026": "aniket.gokhale@pw.live",
  "VIDYAPEETH 61-NR101EA 2026": "sandeep.borase@pw.live",
  "61-NR101EA 2026": "sandeep.borase@pw.live",
  "TUITION 61-NR101EA 2026": "sandeep.borase@pw.live",
  "SIP 61-NR101EA 2026": "sandeep.borase@pw.live",
  "VIDYAPEETH 61-UR101EA 2026": "sandeep.borase@pw.live",
  "61-UR101EA 2026": "sandeep.borase@pw.live",
  "TUITION 61-UR101EA 2026": "sandeep.borase@pw.live",
  "SIP 61-UR101EA 2026": "sandeep.borase@pw.live",
  "VIDYAPEETH 27-NR121EA 2026": "aniket.kangude@pw.live",
  "27-NR121EA 2026": "aniket.kangude@pw.live",
  "TUITION 27-NR121EA 2026": "aniket.kangude@pw.live",
  "SIP 27-NR121EA 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH 27-UR121EA 2026": "swapnil.jadhav@pw.live",
  "27-UR121EA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-UR121EA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-UR121EA 2026": "swapnil.jadhav@pw.live",
  "UR121EA": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 27-NR151EA 2026": "aniket.mishra2@pw.live",
  "27-NR151EA 2026": "aniket.mishra2@pw.live",
  "TUITION 27-NR151EA 2026": "aniket.mishra2@pw.live",
  "SIP 27-NR151EA 2026": "aniket.mishra2@pw.live",
  "VIDYAPEETH 27-UR151EA 2026": "aniket.mishra2@pw.live",
  "27-UR151EA 2026": "aniket.mishra2@pw.live",
  "TUITION 27-UR151EA 2026": "aniket.mishra2@pw.live",
  "SIP 27-UR151EA 2026": "aniket.mishra2@pw.live",
  "VIDYAPEETH 27-NR171EA 2026": "nitish.kumar6@pw.live",
  "27-NR171EA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-NR171EA 2026": "nitish.kumar6@pw.live",
  "SIP 27-NR171EA 2026": "nitish.kumar6@pw.live",
  "NR171EA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 27-UR171EA 2026": "nitish.kumar6@pw.live",
  "27-UR171EA 2026": "nitish.kumar6@pw.live",
  "TUITION 27-UR171EA 2026": "nitish.kumar6@pw.live",
  "SIP 27-UR171EA 2026": "nitish.kumar6@pw.live",
  "UR171EA": "nitish.kumar6@pw.live",
  "VIDYAPEETH 36-AJ401MA 2026": "yogesh.bhalerao@pw.live",
  "36-AJ401MA 2026": "yogesh.bhalerao@pw.live",
  "TUITION 36-AJ401MA 2026": "yogesh.bhalerao@pw.live",
  "SIP 36-AJ401MA 2026": "yogesh.bhalerao@pw.live",
  "VIDYAPEETH 36-AM301MA 2026": "yogesh.bhalerao@pw.live",
  "36-AM301MA 2026": "yogesh.bhalerao@pw.live",
  "TUITION 36-AM301MA 2026": "yogesh.bhalerao@pw.live",
  "SIP 36-AM301MA 2026": "yogesh.bhalerao@pw.live",
  "VIDYAPEETH 51-AJ451NA 2026": "anup.kumar2@pw.live",
  "51-AJ451NA 2026": "anup.kumar2@pw.live",
  "TUITION 51-AJ451NA 2026": "anup.kumar2@pw.live",
  "SIP 51-AJ451NA 2026": "anup.kumar2@pw.live",
  "VIDYAPEETH 27-AJ251NP 2026": "aniket.mishra2@pw.live",
  "27-AJ251NP 2026": "aniket.mishra2@pw.live",
  "TUITION 27-AJ251NP 2026": "aniket.mishra2@pw.live",
  "SIP 27-AJ251NP 2026": "aniket.mishra2@pw.live",
  "AJ251NP": "aniket.mishra2@pw.live",
  "SIP S41-NF32NA 2026": "lavish.dhingra@pw.live",
  "S41-NF32NA 2026": "lavish.dhingra@pw.live",
  "TUITION S41-NF32NA 2026": "lavish.dhingra@pw.live",
  "VIDYAPEETH S41-NF32NA 2026": "lavish.dhingra@pw.live",
  "NF32NA": "lavish.dhingra@pw.live",
  "SIP S41-UP32NA 2026": "lavish.dhingra@pw.live",
  "S41-UP32NA 2026": "lavish.dhingra@pw.live",
  "TUITION S41-UP32NA 2026": "lavish.dhingra@pw.live",
  "VIDYAPEETH S41-UP32NA 2026": "lavish.dhingra@pw.live",
  "UP32NA": "lavish.dhingra@pw.live",
  "VIDYAPEETH 42-AJ401MA 2026": "jyoti.sonawane@pw.live",
  "42-AJ401MA 2026": "jyoti.sonawane@pw.live",
  "TUITION 42-AJ401MA 2026": "jyoti.sonawane@pw.live",
  "SIP 42-AJ401MA 2026": "jyoti.sonawane@pw.live",
  "VIDYAPEETH 93-AJ511EA 2026": "manish.kumar11@pw.live",
  "93-AJ511EA 2026": "manish.kumar11@pw.live",
  "TUITION 93-AJ511EA 2026": "manish.kumar11@pw.live",
  "SIP 93-AJ511EA 2026": "manish.kumar11@pw.live",
  "AJ511EA": "manish.kumar11@pw.live",
  "VIDYAPEETH 93-AN411EA 2026": "manish.kumar11@pw.live",
  "93-AN411EA 2026": "manish.kumar11@pw.live",
  "TUITION 93-AN411EA 2026": "manish.kumar11@pw.live",
  "SIP 93-AN411EA 2026": "manish.kumar11@pw.live",
  "AN411EA": "manish.kumar11@pw.live",
  "VIDYAPEETH 93-YN511NA 2026": "manish.kumar11@pw.live",
  "93-YN511NA 2026": "manish.kumar11@pw.live",
  "TUITION 93-YN511NA 2026": "manish.kumar11@pw.live",
  "SIP 93-YN511NA 2026": "manish.kumar11@pw.live",
  "YN511NA": "manish.kumar11@pw.live",
  "VIDYAPEETH 1H-AJ401NA 2026": "rishabh.paswan@pw.live",
  "1H-AJ401NA 2026": "rishabh.paswan@pw.live",
  "TUITION 1H-AJ401NA 2026": "rishabh.paswan@pw.live",
  "SIP 1H-AJ401NA 2026": "rishabh.paswan@pw.live",
  "VIDYAPEETH 61-AJ401NA 2026": "anil.kumar8@pw.live",
  "61-AJ401NA 2026": "anil.kumar8@pw.live",
  "TUITION 61-AJ401NA 2026": "anil.kumar8@pw.live",
  "SIP 61-AJ401NA 2026": "anil.kumar8@pw.live",
  "VIDYAPEETH 61-AN401NA 2026": "ankit.shrivastava@pw.live",
  "61-AN401NA 2026": "ankit.shrivastava@pw.live",
  "TUITION 61-AN401NA 2026": "ankit.shrivastava@pw.live",
  "SIP 61-AN401NA 2026": "ankit.shrivastava@pw.live",
  "VIDYAPEETH 61-NF201EA 2026": "sagar.gaud@pw.live",
  "61-NF201EA 2026": "sagar.gaud@pw.live",
  "TUITION 61-NF201EA 2026": "sagar.gaud@pw.live",
  "SIP 61-NF201EA 2026": "sagar.gaud@pw.live",
  "VIDYAPEETH 69-YN501NA 2026": "rishabh.paswan@pw.live",
  "69-YN501NA 2026": "rishabh.paswan@pw.live",
  "TUITION 69-YN501NA 2026": "rishabh.paswan@pw.live",
  "SIP 69-YN501NA 2026": "rishabh.paswan@pw.live",
  "YN501NA": "syed.ali3@pw.live",
  "VIDYAPEETH 51-AN561EA 2026": "sakshi.bhardwaj@pw.live",
  "51-AN561EA 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-AN561EA 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-AN561EA 2026": "sakshi.bhardwaj@pw.live",
  "AN561EA": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH 27-AJ452NA 2026": "aniket.mishra2@pw.live",
  "27-AJ452NA 2026": "aniket.mishra2@pw.live",
  "TUITION 27-AJ452NA 2026": "aniket.mishra2@pw.live",
  "SIP 27-AJ452NA 2026": "aniket.mishra2@pw.live",
  "AJ452NA": "aniket.mishra2@pw.live",
  "VIDYAPEETH 27-LM251NA 2026": "ashwini.kumar4@pw.live",
  "27-LM251NA 2026": "ashwini.kumar4@pw.live",
  "TUITION 27-LM251NA 2026": "ashwini.kumar4@pw.live",
  "SIP 27-LM251NA 2026": "ashwini.kumar4@pw.live",
  "LM251NA": "ashwini.kumar4@pw.live",
  "VIDYAPEETH 69-NF202EA 2026": "kishor.gaikwad1@pw.live",
  "69-NF202EA 2026": "kishor.gaikwad1@pw.live",
  "TUITION 69-NF202EA 2026": "kishor.gaikwad1@pw.live",
  "SIP 69-NF202EA 2026": "kishor.gaikwad1@pw.live",
  "NF202EA": "kishor.gaikwad1@pw.live",
  "VIDYAPEETH 36-NF401EA 2026": "ganesh.gavhane@pw.live",
  "36-NF401EA 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-NF401EA 2026": "ganesh.gavhane@pw.live",
  "SIP 36-NF401EA 2026": "ganesh.gavhane@pw.live",
  "NF401EA": "ganesh.gavhane@pw.live",
  "VIDYAPEETH 94-NF301ES 2026": "saurabh.tiwari3@pw.live",
  "94-NF301ES 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-NF301ES 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-NF301ES 2026": "saurabh.tiwari3@pw.live",
  "NF301ES": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 51-AN501EA 2026": "manish.kumar11@pw.live",
  "51-AN501EA 2026": "manish.kumar11@pw.live",
  "TUITION 51-AN501EA 2026": "manish.kumar11@pw.live",
  "SIP 51-AN501EA 2026": "manish.kumar11@pw.live",
  "AN501EA": "manish.kumar11@pw.live",
  "VIDYAPEETH 51-YN401NA 2026": "manish.kumar11@pw.live",
  "51-YN401NA 2026": "manish.kumar11@pw.live",
  "TUITION 51-YN401NA 2026": "manish.kumar11@pw.live",
  "SIP 51-YN401NA 2026": "manish.kumar11@pw.live",
  "VIDYAPEETH 51-AJ431MA 2026": "vivek.kumar19@pw.live",
  "51-AJ431MA 2026": "vivek.kumar19@pw.live",
  "TUITION 51-AJ431MA 2026": "vivek.kumar19@pw.live",
  "SIP 51-AJ431MA 2026": "vivek.kumar19@pw.live",
  "AJ431MA": "vivek.kumar19@pw.live",
  "TUITION T51-AM31MA 2026": "sakshi.bhardwaj@pw.live",
  "T51-AM31MA 2026": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH T51-AM31MA 2026": "sakshi.bhardwaj@pw.live",
  "SIP T51-AM31MA 2026": "sakshi.bhardwaj@pw.live",
  "AM31MA": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH 61-AN201NP 2026": "ankit.shrivastava@pw.live",
  "61-AN201NP 2026": "ankit.shrivastava@pw.live",
  "TUITION 61-AN201NP 2026": "ankit.shrivastava@pw.live",
  "SIP 61-AN201NP 2026": "ankit.shrivastava@pw.live",
  "AN201NP": "anil.polkamwar@pw.live",
  "SIP S2P-AJ41NA 2026": "aniket.gokhale@pw.live",
  "S2P-AJ41NA 2026": "aniket.gokhale@pw.live",
  "TUITION S2P-AJ41NA 2026": "aniket.gokhale@pw.live",
  "VIDYAPEETH S2P-AJ41NA 2026": "aniket.gokhale@pw.live",
  "AJ41NA": "aniket.gokhale@pw.live",
  "SIP S2P-AN41NA 2026": "aniket.gokhale@pw.live",
  "S2P-AN41NA 2026": "aniket.gokhale@pw.live",
  "TUITION S2P-AN41NA 2026": "aniket.gokhale@pw.live",
  "VIDYAPEETH S2P-AN41NA 2026": "aniket.gokhale@pw.live",
  "AN41NA": "aniket.gokhale@pw.live",
  "SIP S2P-LJ31NA 2026": "aniket.gokhale@pw.live",
  "S2P-LJ31NA 2026": "aniket.gokhale@pw.live",
  "TUITION S2P-LJ31NA 2026": "aniket.gokhale@pw.live",
  "VIDYAPEETH S2P-LJ31NA 2026": "aniket.gokhale@pw.live",
  "LJ31NA": "aniket.gokhale@pw.live",
  "SIP S2P-LN31NA 2026": "aniket.gokhale@pw.live",
  "S2P-LN31NA 2026": "aniket.gokhale@pw.live",
  "TUITION S2P-LN31NA 2026": "aniket.gokhale@pw.live",
  "VIDYAPEETH S2P-LN31NA 2026": "aniket.gokhale@pw.live",
  "LN31NA": "aniket.gokhale@pw.live",
  "SIP S94-AM31MS 2026": "aniket.kangude@pw.live",
  "S94-AM31MS 2026": "aniket.kangude@pw.live",
  "TUITION S94-AM31MS 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH S94-AM31MS 2026": "aniket.kangude@pw.live",
  "AM31MS": "aniket.kangude@pw.live",
  "SIP S94-LM31MS 2026": "aniket.kangude@pw.live",
  "S94-LM31MS 2026": "aniket.kangude@pw.live",
  "TUITION S94-LM31MS 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH S94-LM31MS 2026": "aniket.kangude@pw.live",
  "LM31MS": "aniket.kangude@pw.live",
  "VIDYAPEETH 51-AJ561EA 2026": "sakshi.bhardwaj@pw.live",
  "51-AJ561EA 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-AJ561EA 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-AJ561EA 2026": "sakshi.bhardwaj@pw.live",
  "AJ561EA": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH 27-AM521EA 2026": "yuvraj.hada1@pw.live",
  "27-AM521EA 2026": "yuvraj.hada1@pw.live",
  "TUITION 27-AM521EA 2026": "yuvraj.hada1@pw.live",
  "SIP 27-AM521EA 2026": "yuvraj.hada1@pw.live",
  "AM521EA": "yuvraj.hada1@pw.live",
  "VIDYAPEETH 36-AM302MA 2026": "yogesh.bhalerao@pw.live",
  "36-AM302MA 2026": "yogesh.bhalerao@pw.live",
  "TUITION 36-AM302MA 2026": "yogesh.bhalerao@pw.live",
  "SIP 36-AM302MA 2026": "yogesh.bhalerao@pw.live",
  "AM302MA": "yogesh.bhalerao@pw.live",
  "VIDYAPEETH 36-AN401NA 2026": "yogesh.bhalerao@pw.live",
  "36-AN401NA 2026": "yogesh.bhalerao@pw.live",
  "TUITION 36-AN401NA 2026": "yogesh.bhalerao@pw.live",
  "SIP 36-AN401NA 2026": "yogesh.bhalerao@pw.live",
  "VIDYAPEETH 93-NF222EA 2026": "dipali.sonkamble@pw.live",
  "93-NF222EA 2026": "dipali.sonkamble@pw.live",
  "TUITION 93-NF222EA 2026": "dipali.sonkamble@pw.live",
  "SIP 93-NF222EA 2026": "dipali.sonkamble@pw.live",
  "NF222EA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 51-OF131EA 2026": "dipali.sonkamble@pw.live",
  "51-OF131EA 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-OF131EA 2026": "dipali.sonkamble@pw.live",
  "SIP 51-OF131EA 2026": "dipali.sonkamble@pw.live",
  "OF131EA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 27-YN421EA 2026": "prasad.shinde@pw.live",
  "27-YN421EA 2026": "prasad.shinde@pw.live",
  "TUITION 27-YN421EA 2026": "prasad.shinde@pw.live",
  "SIP 27-YN421EA 2026": "prasad.shinde@pw.live",
  "YN421EA": "prasad.shinde@pw.live",
  "VIDYAPEETH 61-LJ102MA 2026": "sagar.gaud@pw.live",
  "61-LJ102MA 2026": "sagar.gaud@pw.live",
  "TUITION 61-LJ102MA 2026": "sagar.gaud@pw.live",
  "SIP 61-LJ102MA 2026": "sagar.gaud@pw.live",
  "VIDYAPEETH 51-AJ222NA 2026": "ruhi.maqbool@pw.live",
  "51-AJ222NA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-AJ222NA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-AJ222NA 2026": "ruhi.maqbool@pw.live",
  "AJ222NA": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 60-AJ203MA 2026": "aniket.gokhale@pw.live",
  "60-AJ203MA 2026": "aniket.gokhale@pw.live",
  "TUITION 60-AJ203MA 2026": "aniket.gokhale@pw.live",
  "SIP 60-AJ203MA 2026": "aniket.gokhale@pw.live",
  "VIDYAPEETH 51-AN461NP 2026": "sakshi.bhardwaj@pw.live",
  "51-AN461NP 2026": "sakshi.bhardwaj@pw.live",
  "TUITION 51-AN461NP 2026": "sakshi.bhardwaj@pw.live",
  "SIP 51-AN461NP 2026": "sakshi.bhardwaj@pw.live",
  "AN461NP": "sakshi.bhardwaj@pw.live",
  "VIDYAPEETH 51-AN451NA 2026": "anup.kumar2@pw.live",
  "51-AN451NA 2026": "anup.kumar2@pw.live",
  "TUITION 51-AN451NA 2026": "anup.kumar2@pw.live",
  "SIP 51-AN451NA 2026": "anup.kumar2@pw.live",
  "AN451NA": "anup.kumar2@pw.live",
  "VIDYAPEETH 61-AJ201NP 2026": "sandeep.borase@pw.live",
  "61-AJ201NP 2026": "sandeep.borase@pw.live",
  "TUITION 61-AJ201NP 2026": "sandeep.borase@pw.live",
  "SIP 61-AJ201NP 2026": "sandeep.borase@pw.live",
  "AJ201NP": "anil.polkamwar@pw.live",
  "VIDYAPEETH 27-YN451NA 2026": "aniket.mishra2@pw.live",
  "27-YN451NA 2026": "aniket.mishra2@pw.live",
  "TUITION 27-YN451NA 2026": "aniket.mishra2@pw.live",
  "SIP 27-YN451NA 2026": "aniket.mishra2@pw.live",
  "VIDYAPEETH 27-AN251NP 2026": "meenakshi.chauhan1@pw.live",
  "27-AN251NP 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-AN251NP 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-AN251NP 2026": "meenakshi.chauhan1@pw.live",
  "AN251NP": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 60-YN402MA 2026": "sunita.wakle@pw.live",
  "60-YN402MA 2026": "sunita.wakle@pw.live",
  "TUITION 60-YN402MA 2026": "sunita.wakle@pw.live",
  "SIP 60-YN402MA 2026": "sunita.wakle@pw.live",
  "YN402MA": "sunita.wakle@pw.live",
  "VIDYAPEETH 60-YN403MA 2026": "syed.ali3@pw.live",
  "60-YN403MA 2026": "syed.ali3@pw.live",
  "TUITION 60-YN403MA 2026": "syed.ali3@pw.live",
  "SIP 60-YN403MA 2026": "syed.ali3@pw.live",
  "YN403MA": "syed.ali3@pw.live",
  "VIDYAPEETH 27-AN551NA 2026": "meenakshi.chauhan1@pw.live",
  "27-AN551NA 2026": "meenakshi.chauhan1@pw.live",
  "TUITION 27-AN551NA 2026": "meenakshi.chauhan1@pw.live",
  "SIP 27-AN551NA 2026": "meenakshi.chauhan1@pw.live",
  "AN551NA": "meenakshi.chauhan1@pw.live",
  "VIDYAPEETH 51-YN421NA 2026": "anirban.das@pw.live",
  "51-YN421NA 2026": "anirban.das@pw.live",
  "TUITION 51-YN421NA 2026": "anirban.das@pw.live",
  "SIP 51-YN421NA 2026": "anirban.das@pw.live",
  "YN421NA": "vivek.kumar19@pw.live",
  "VIDYAPEETH 93-YN421NA 2026": "vivek.kumar19@pw.live",
  "93-YN421NA 2026": "vivek.kumar19@pw.live",
  "TUITION 93-YN421NA 2026": "vivek.kumar19@pw.live",
  "SIP 93-YN421NA 2026": "vivek.kumar19@pw.live",
  "SIP S94-AJ31MA 2026": "aniket.kangude@pw.live",
  "S94-AJ31MA 2026": "aniket.kangude@pw.live",
  "TUITION S94-AJ31MA 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH S94-AJ31MA 2026": "aniket.kangude@pw.live",
  "SIP S94-AN31MA 2026": "aniket.kangude@pw.live",
  "S94-AN31MA 2026": "aniket.kangude@pw.live",
  "TUITION S94-AN31MA 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH S94-AN31MA 2026": "aniket.kangude@pw.live",
  "SIP S94-LN31MA 2026": "aniket.kangude@pw.live",
  "S94-LN31MA 2026": "aniket.kangude@pw.live",
  "TUITION S94-LN31MA 2026": "aniket.kangude@pw.live",
  "VIDYAPEETH S94-LN31MA 2026": "aniket.kangude@pw.live",
  "LN31MA": "aniket.kangude@pw.live",
  "VIDYAPEETH 51-AJ251MP 2026": "abhirathi.sarkar@pw.live",
  "51-AJ251MP 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-AJ251MP 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-AJ251MP 2026": "abhirathi.sarkar@pw.live",
  "AJ251MP": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 1H-UF201ES 2026": "jyoti.sonawane@pw.live",
  "1H-UF201ES 2026": "jyoti.sonawane@pw.live",
  "TUITION 1H-UF201ES 2026": "jyoti.sonawane@pw.live",
  "SIP 1H-UF201ES 2026": "jyoti.sonawane@pw.live",
  "VIDYAPEETH 51-UF152EA 2026": "anup.kumar2@pw.live",
  "51-UF152EA 2026": "anup.kumar2@pw.live",
  "TUITION 51-UF152EA 2026": "anup.kumar2@pw.live",
  "SIP 51-UF152EA 2026": "anup.kumar2@pw.live",
  "VIDYAPEETH 60-YN501MA 2026": "aniket.gokhale@pw.live",
  "60-YN501MA 2026": "aniket.gokhale@pw.live",
  "TUITION 60-YN501MA 2026": "aniket.gokhale@pw.live",
  "SIP 60-YN501MA 2026": "aniket.gokhale@pw.live",
  "VIDYAPEETH 69-AJ201MP 2026": "rishabh.paswan@pw.live",
  "69-AJ201MP 2026": "rishabh.paswan@pw.live",
  "TUITION 69-AJ201MP 2026": "rishabh.paswan@pw.live",
  "SIP 69-AJ201MP 2026": "rishabh.paswan@pw.live",
  "AJ201MP": "ganesh.gavhane@pw.live",
  "VIDYAPEETH 69-AN201MP 2026": "rishabh.paswan@pw.live",
  "69-AN201MP 2026": "rishabh.paswan@pw.live",
  "TUITION 69-AN201MP 2026": "rishabh.paswan@pw.live",
  "SIP 69-AN201MP 2026": "rishabh.paswan@pw.live",
  "AN201MP": "rishabh.paswan@pw.live",
  "VIDYAPEETH 42-AJ201NP 2026": "anil.polkamwar@pw.live",
  "42-AJ201NP 2026": "anil.polkamwar@pw.live",
  "TUITION 42-AJ201NP 2026": "anil.polkamwar@pw.live",
  "SIP 42-AJ201NP 2026": "anil.polkamwar@pw.live",
  "VIDYAPEETH 42-AN201NP 2026": "anil.polkamwar@pw.live",
  "42-AN201NP 2026": "anil.polkamwar@pw.live",
  "TUITION 42-AN201NP 2026": "anil.polkamwar@pw.live",
  "SIP 42-AN201NP 2026": "anil.polkamwar@pw.live",
  "VIDYAPEETH 60-AJ101MP 2026": "papender.kanwar@pw.live",
  "60-AJ101MP 2026": "papender.kanwar@pw.live",
  "TUITION 60-AJ101MP 2026": "papender.kanwar@pw.live",
  "SIP 60-AJ101MP 2026": "papender.kanwar@pw.live",
  "AJ101MP": "papender.kanwar@pw.live",
  "VIDYAPEETH 60-AN101MP 2026": "papender.kanwar@pw.live",
  "60-AN101MP 2026": "papender.kanwar@pw.live",
  "TUITION 60-AN101MP 2026": "papender.kanwar@pw.live",
  "SIP 60-AN101MP 2026": "papender.kanwar@pw.live",
  "AN101MP": "papender.kanwar@pw.live",
  "VIDYAPEETH 69-UP201ES 2026": "rishabh.paswan@pw.live",
  "69-UP201ES 2026": "rishabh.paswan@pw.live",
  "TUITION 69-UP201ES 2026": "rishabh.paswan@pw.live",
  "SIP 69-UP201ES 2026": "rishabh.paswan@pw.live",
  "UP201ES": "rishabh.paswan@pw.live",
  "VIDYAPEETH 60-PJ401MP 2026": "syed.ali3@pw.live",
  "60-PJ401MP 2026": "syed.ali3@pw.live",
  "TUITION 60-PJ401MP 2026": "syed.ali3@pw.live",
  "SIP 60-PJ401MP 2026": "syed.ali3@pw.live",
  "PJ401MP": "syed.ali3@pw.live",
  "VIDYAPEETH 27-AJ271NP 2026": "nitish.kumar6@pw.live",
  "27-AJ271NP 2026": "nitish.kumar6@pw.live",
  "TUITION 27-AJ271NP 2026": "nitish.kumar6@pw.live",
  "SIP 27-AJ271NP 2026": "nitish.kumar6@pw.live",
  "AJ271NP": "nitish.kumar6@pw.live",
  "VIDYAPEETH 51-AM222EA 2026": "ruhi.maqbool@pw.live",
  "51-AM222EA 2026": "ruhi.maqbool@pw.live",
  "TUITION 51-AM222EA 2026": "ruhi.maqbool@pw.live",
  "SIP 51-AM222EA 2026": "ruhi.maqbool@pw.live",
  "AM222EA": "ruhi.maqbool@pw.live",
  "VIDYAPEETH 1H-UP202EA 2026": "rishabh.paswan@pw.live",
  "1H-UP202EA 2026": "rishabh.paswan@pw.live",
  "TUITION 1H-UP202EA 2026": "rishabh.paswan@pw.live",
  "SIP 1H-UP202EA 2026": "rishabh.paswan@pw.live",
  "UP202EA": "rishabh.paswan@pw.live",
  "VIDYAPEETH 61-PJ401NA 2026": "anil.kumar8@pw.live",
  "61-PJ401NA 2026": "anil.kumar8@pw.live",
  "TUITION 61-PJ401NA 2026": "anil.kumar8@pw.live",
  "SIP 61-PJ401NA 2026": "anil.kumar8@pw.live",
  "VIDYAPEETH 27-AJ121EP 2026": "swapnil.jadhav@pw.live",
  "27-AJ121EP 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-AJ121EP 2026": "swapnil.jadhav@pw.live",
  "SIP 27-AJ121EP 2026": "swapnil.jadhav@pw.live",
  "AJ121EP": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 27-YN551NA 2026": "ashwini.kumar4@pw.live",
  "27-YN551NA 2026": "ashwini.kumar4@pw.live",
  "TUITION 27-YN551NA 2026": "ashwini.kumar4@pw.live",
  "SIP 27-YN551NA 2026": "ashwini.kumar4@pw.live",
  "YN551NA": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 51-AN231MP 2026": "dipali.sonkamble@pw.live",
  "51-AN231MP 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-AN231MP 2026": "dipali.sonkamble@pw.live",
  "SIP 51-AN231MP 2026": "dipali.sonkamble@pw.live",
  "AN231MP": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 27-AJ261NP 2026": "kanchan.jaiswal@pw.live",
  "27-AJ261NP 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-AJ261NP 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-AJ261NP 2026": "kanchan.jaiswal@pw.live",
  "AJ261NP": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 27-AN261NP 2026": "kanchan.jaiswal@pw.live",
  "27-AN261NP 2026": "kanchan.jaiswal@pw.live",
  "TUITION 27-AN261NP 2026": "kanchan.jaiswal@pw.live",
  "SIP 27-AN261NP 2026": "kanchan.jaiswal@pw.live",
  "AN261NP": "kanchan.jaiswal@pw.live",
  "VIDYAPEETH 69-LJ201MP 2026": "rishabh.paswan@pw.live",
  "69-LJ201MP 2026": "rishabh.paswan@pw.live",
  "TUITION 69-LJ201MP 2026": "rishabh.paswan@pw.live",
  "SIP 69-LJ201MP 2026": "rishabh.paswan@pw.live",
  "LJ201MP": "rishabh.paswan@pw.live",
  "VIDYAPEETH 51-YN531NA 2026": "dipali.sonkamble@pw.live",
  "51-YN531NA 2026": "dipali.sonkamble@pw.live",
  "TUITION 51-YN531NA 2026": "dipali.sonkamble@pw.live",
  "SIP 51-YN531NA 2026": "dipali.sonkamble@pw.live",
  "YN531NA": "dipali.sonkamble@pw.live",
  "VIDYAPEETH 27-NF152EA 2026": "aniket.mishra2@pw.live",
  "27-NF152EA 2026": "aniket.mishra2@pw.live",
  "TUITION 27-NF152EA 2026": "aniket.mishra2@pw.live",
  "SIP 27-NF152EA 2026": "aniket.mishra2@pw.live",
  "NF152EA": "aniket.mishra2@pw.live",
  "VIDYAPEETH 51-AN251MP 2026": "aniket.kangude@pw.live",
  "51-AN251MP 2026": "aniket.kangude@pw.live",
  "TUITION 51-AN251MP 2026": "aniket.kangude@pw.live",
  "SIP 51-AN251MP 2026": "aniket.kangude@pw.live",
  "AN251MP": "aniket.kangude@pw.live",
  "VIDYAPEETH 36-YA501NA 2026": "ganesh.gavhane@pw.live",
  "36-YA501NA 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-YA501NA 2026": "ganesh.gavhane@pw.live",
  "SIP 36-YA501NA 2026": "ganesh.gavhane@pw.live",
  "YA501NA": "ganesh.gavhane@pw.live",
  "VIDYAPEETH 42-YA501MA 2026": "soniya.parmar@pw.live",
  "42-YA501MA 2026": "soniya.parmar@pw.live",
  "TUITION 42-YA501MA 2026": "soniya.parmar@pw.live",
  "SIP 42-YA501MA 2026": "soniya.parmar@pw.live",
  "YA501MA": "soniya.parmar@pw.live",
  "VIDYAPEETH 94-YA601MA 2026": "saurabh.tiwari3@pw.live",
  "94-YA601MA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-YA601MA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-YA601MA 2026": "saurabh.tiwari3@pw.live",
  "YA601MA": "saurabh.tiwari3@pw.live",
  "VIDYAPEETH 51-YA671NA 2026": "muzamil.bhat@pw.live",
  "51-YA671NA 2026": "muzamil.bhat@pw.live",
  "TUITION 51-YA671NA 2026": "muzamil.bhat@pw.live",
  "SIP 51-YA671NA 2026": "muzamil.bhat@pw.live",
  "YA671NA": "muzamil.bhat@pw.live",
  "VIDYAPEETH 51-YN521NA 2026": "anirban.das@pw.live",
  "51-YN521NA 2026": "anirban.das@pw.live",
  "TUITION 51-YN521NA 2026": "anirban.das@pw.live",
  "SIP 51-YN521NA 2026": "anirban.das@pw.live",
  "YN521NA": "anirban.das@pw.live",
  "VIDYAPEETH 61-YN501NA 2026": "sagar.gaud@pw.live",
  "61-YN501NA 2026": "sagar.gaud@pw.live",
  "TUITION 61-YN501NA 2026": "sagar.gaud@pw.live",
  "SIP 61-YN501NA 2026": "sagar.gaud@pw.live",
  "VIDYAPEETH 51-LJ281DA 2026": "vishal.rajput2@pw.live",
  "51-LJ281DA 2026": "vishal.rajput2@pw.live",
  "TUITION 51-LJ281DA 2026": "vishal.rajput2@pw.live",
  "SIP 51-LJ281DA 2026": "vishal.rajput2@pw.live",
  "LJ281DA": "vishal.rajput2@pw.live",
  "VIDYAPEETH 94-YA611MA 2026": "saurabh.tiwari3@pw.live",
  "94-YA611MA 2026": "saurabh.tiwari3@pw.live",
  "TUITION 94-YA611MA 2026": "saurabh.tiwari3@pw.live",
  "SIP 94-YA611MA 2026": "saurabh.tiwari3@pw.live",
  "YA611MA": "saurabh.tiwari3@pw.live",
  "SIP S41-YN51MA 2026": "lavish.dhingra@pw.live",
  "S41-YN51MA 2026": "lavish.dhingra@pw.live",
  "TUITION S41-YN51MA 2026": "lavish.dhingra@pw.live",
  "VIDYAPEETH S41-YN51MA 2026": "lavish.dhingra@pw.live",
  "YN51MA": "lavish.dhingra@pw.live",
  "VIDYAPEETH 51-PJ381DA 2026": "vishal.rajput2@pw.live",
  "51-PJ381DA 2026": "vishal.rajput2@pw.live",
  "TUITION 51-PJ381DA 2026": "vishal.rajput2@pw.live",
  "SIP 51-PJ381DA 2026": "vishal.rajput2@pw.live",
  "PJ381DA": "vishal.rajput2@pw.live",
  "VIDYAPEETH 69-YA601NA 2026": "rishabh.paswan@pw.live",
  "69-YA601NA 2026": "rishabh.paswan@pw.live",
  "TUITION 69-YA601NA 2026": "rishabh.paswan@pw.live",
  "SIP 69-YA601NA 2026": "rishabh.paswan@pw.live",
  "YA601NA": "vishal.rajput2@pw.live",
  "VIDYAPEETH 51-YN581DA 2026": "vishal.rajput2@pw.live",
  "51-YN581DA 2026": "vishal.rajput2@pw.live",
  "TUITION 51-YN581DA 2026": "vishal.rajput2@pw.live",
  "SIP 51-YN581DA 2026": "vishal.rajput2@pw.live",
  "YN581DA": "vishal.rajput2@pw.live",
  "VIDYAPEETH 51-YA691NA 2026": "joyes.ashirwadam@pw.live",
  "51-YA691NA 2026": "joyes.ashirwadam@pw.live",
  "TUITION 51-YA691NA 2026": "joyes.ashirwadam@pw.live",
  "SIP 51-YA691NA 2026": "joyes.ashirwadam@pw.live",
  "YA691NA": "joyes.ashirwadam@pw.live",
  "VIDYAPEETH 27-YN521EA 2026": "swapnil.jadhav@pw.live",
  "27-YN521EA 2026": "swapnil.jadhav@pw.live",
  "TUITION 27-YN521EA 2026": "swapnil.jadhav@pw.live",
  "SIP 27-YN521EA 2026": "swapnil.jadhav@pw.live",
  "YN521EA": "swapnil.jadhav@pw.live",
  "VIDYAPEETH 36-AJ501NA 2026": "ganesh.gavhane@pw.live",
  "36-AJ501NA 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-AJ501NA 2026": "ganesh.gavhane@pw.live",
  "SIP 36-AJ501NA 2026": "ganesh.gavhane@pw.live",
  "AJ501NA": "ganesh.gavhane@pw.live",
  "VIDYAPEETH 51-YA601NA 2026": "vishal.rajput2@pw.live",
  "51-YA601NA 2026": "vishal.rajput2@pw.live",
  "TUITION 51-YA601NA 2026": "vishal.rajput2@pw.live",
  "SIP 51-YA601NA 2026": "vishal.rajput2@pw.live",
  "VIDYAPEETH 51-YN551NA 2026": "abhirathi.sarkar@pw.live",
  "51-YN551NA 2026": "abhirathi.sarkar@pw.live",
  "TUITION 51-YN551NA 2026": "abhirathi.sarkar@pw.live",
  "SIP 51-YN551NA 2026": "abhirathi.sarkar@pw.live",
  "VIDYAPEETH 60-YN501NA 2026": "syed.ali3@pw.live",
  "60-YN501NA 2026": "syed.ali3@pw.live",
  "TUITION 60-YN501NA 2026": "syed.ali3@pw.live",
  "SIP 60-YN501NA 2026": "syed.ali3@pw.live",
  "VIDYAPEETH 27-YA651NA 2026": "aniket.mishra2@pw.live",
  "27-YA651NA 2026": "aniket.mishra2@pw.live",
  "TUITION 27-YA651NA 2026": "aniket.mishra2@pw.live",
  "SIP 27-YA651NA 2026": "aniket.mishra2@pw.live",
  "YA651NA": "aniket.mishra2@pw.live",
  "VIDYAPEETH 60-YN511CP 2026": "pawan.verma@pw.live",
  "60-YN511CP 2026": "pawan.verma@pw.live",
  "TUITION 60-YN511CP 2026": "pawan.verma@pw.live",
  "SIP 60-YN511CP 2026": "pawan.verma@pw.live",
  "YN511CP": "pawan.verma@pw.live",
  "VIDYAPEETH 36-AJ201MP 2026": "ganesh.gavhane@pw.live",
  "36-AJ201MP 2026": "ganesh.gavhane@pw.live",
  "TUITION 36-AJ201MP 2026": "ganesh.gavhane@pw.live",
  "SIP 36-AJ201MP 2026": "ganesh.gavhane@pw.live"
};

// server.ts
dotenv.config({ path: [".env.local", ".env"] });
var ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
var app = express();
app.use(express.json());
app.use((req, _res, next) => {
  if (req.originalUrl && req.url !== req.originalUrl) {
    req.url = req.originalUrl;
  }
  next();
});
var getGoogleAuth = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }
  const token = authHeader.split(" ")[1];
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });
  return oauth2Client;
};
function indexToColLetter(index) {
  let temp = index;
  let letter = "";
  while (temp >= 0) {
    letter = String.fromCharCode(temp % 26 + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}
function extractCode(batchName) {
  let raw = (batchName || "").toString().trim().toUpperCase();
  const parts = raw.split("-");
  if (parts.length > 1) raw = parts[1].trim();
  raw = raw.replace(/\s*20\d{2}\s*$/i, "");
  raw = raw.replace(/[^A-Z0-9]/g, "");
  return raw;
}
function getCategory(batchName) {
  const code = extractCode(batchName);
  const prefix = code.substring(0, 2);
  if (["LJ", "AJ", "PJ"].includes(prefix)) return "JEE";
  if (["LN", "AN", "YN", "YA"].includes(prefix)) return "NEET";
  if (["UF", "NF", "UP"].includes(prefix)) return "Foundation";
  return "Other";
}
function getPhase(batchName) {
  const code = extractCode(batchName);
  if (code.length < 3) return "Unknown";
  const ch = code.charAt(2);
  if (ch === "E" || ch === "1") return "Phase 1";
  if (ch === "2") return "Phase 2";
  if (ch === "3") return "Phase 3";
  const n = parseInt(ch, 10);
  if (!isNaN(n) && n >= 4) return "Phase 4+";
  return "Unknown";
}
function getTimeSlot(batchName) {
  const code = extractCode(batchName);
  if (code.length < 2) return "";
  const suffix = code.substring(code.length - 2);
  if (["MA", "MP"].includes(suffix)) return "Morning";
  if (["NA", "NP"].includes(suffix)) return "Afternoon";
  if (["EA", "EP"].includes(suffix)) return "Evening";
  if (suffix === "WA") return "Weekend";
  return "";
}
var TIMETABLE_SHEET_IDS = [
  "1U5BGET6T_6vzFdEj1BrktFyeKAUNM3le-d6_QXX3IdE",
  "1YRDNMMvsCO8zBzfWP2JA__ewJZqyb8oIUBG8n3evps8",
  "1aUGmqbnCdVIXrmRXwHTItUN6kKTmk0UFuFi5D172NC4",
  "1qsgnhF3JTHPJKYSf19uSj5xtivxIDib1CnwSj-kSioE",
  "1PnpJ7N0VGyn093T3DGxg5DY7RgcEw1sjvJh7ZWhRw20",
  "103nQ5mxTrQFu8fQgppgzQIkOhbIrrY4VN5s3WpFx4p4",
  "1JtBcMmkNwnt2hqNgIEBGwNlcdEN4YziQYAN4j6q3GE0",
  "1KbI77PEFsxFqFB1ElUQlqSxz9ixTBevxt7wJPNI8FFU",
  "1po8VrTl5DXXwxcJN_evxQRn_5S4oNcxnbObQ5rd2K0w"
];
var centerTimetableMap = {};
function getIstDateInfo() {
  const now = /* @__PURE__ */ new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "short"
  }).formatToParts(now);
  const getPart = (type) => parts.find((p) => p.type === type)?.value || "";
  const day = getPart("day");
  const month = getPart("month");
  const year = getPart("year");
  const weekday = getPart("weekday");
  const dateStr = `${day}-${month}-${year}`;
  return { dateStr, dayStr: weekday, now };
}
function parseTimeString(timeStr, baseDate) {
  try {
    const clean = (timeStr || "").trim();
    const match = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = (match[3] || "").toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    const d = new Date(baseDate);
    d.setHours(hours, minutes, 0, 0);
    return d;
  } catch {
    return null;
  }
}
function computeLectureStatus(startTimeStr, endTimeStr, isToday, now) {
  if (!isToday) return "upcoming";
  try {
    const start = parseTimeString(startTimeStr, now);
    const end = parseTimeString(endTimeStr, now);
    if (!start || !end) return "upcoming";
    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "ongoing";
    if (now > end) return "completed";
  } catch {
  }
  return "upcoming";
}
var rawDbCache = /* @__PURE__ */ new Map();
var RAW_DB_CACHE_TTL_MS = 10 * 60 * 1e3;
var spreadsheetTitleCache = /* @__PURE__ */ new Map();
async function fetchRawDbWithCache(sheets, spreadsheetId, forceRefresh = false) {
  const cached = rawDbCache.get(spreadsheetId);
  if (!forceRefresh && cached && cached.rows && cached.rows.length > 0 && Date.now() - cached.timestamp < RAW_DB_CACHE_TTL_MS) {
    return { title: cached.title, rows: cached.rows };
  }
  const knownTitle = cached?.title || spreadsheetTitleCache.get(spreadsheetId);
  let spreadsheetTitle = knownTitle || spreadsheetId;
  let targetSheetTitle = "Raw_DB";
  try {
    const metaRes = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "properties.title,sheets.properties(sheetId,title)"
    });
    if (metaRes.data?.properties?.title) {
      spreadsheetTitle = metaRes.data.properties.title;
      spreadsheetTitleCache.set(spreadsheetId, spreadsheetTitle);
    }
    const sheetsList = metaRes.data?.sheets || [];
    if (sheetsList.length > 0) {
      const matchTab = sheetsList.find((s) => {
        const t = (s.properties?.title || "").trim().toLowerCase();
        return t === "raw_db" || t === "raw db" || t.includes("raw_db") || t.includes("raw db") || t.includes("raw-db");
      });
      if (matchTab?.properties?.title) {
        targetSheetTitle = matchTab.properties.title;
      } else {
        const ttTab = sheetsList.find((s) => {
          const t = (s.properties?.title || "").trim().toLowerCase();
          return t.includes("current week") || t.includes("time") && t.includes("table") || t.includes("timetable") || t.includes("schedule");
        });
        if (ttTab?.properties?.title) {
          targetSheetTitle = ttTab.properties.title;
        } else if (sheetsList[0]?.properties?.title) {
          targetSheetTitle = sheetsList[0].properties.title;
        }
      }
    }
  } catch (metaErr) {
    console.warn(`Could not get metadata for ${spreadsheetId}:`, metaErr.message);
  }
  let rows = [];
  try {
    const valuesRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${targetSheetTitle}'!A:AZ`
    });
    rows = valuesRes.data?.values || [];
  } catch (valErr) {
    console.warn(`Failed to fetch '${targetSheetTitle}'!A:AZ for ${spreadsheetId}:`, valErr.message);
    try {
      const fallbackRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${targetSheetTitle}'!A1:AZ5000`
      });
      rows = fallbackRes.data?.values || [];
    } catch (fbErr) {
      console.warn(`Fallback range also failed for ${spreadsheetId}:`, fbErr.message);
      if (cached && cached.rows && cached.rows.length > 0) {
        console.log(`[Raw_DB] Returning cached rows for ${spreadsheetId} due to API error.`);
        return { title: cached.title, rows: cached.rows };
      }
    }
  }
  if (rows && rows.length > 0) {
    rawDbCache.set(spreadsheetId, {
      spreadsheetId,
      title: spreadsheetTitle,
      rows,
      timestamp: Date.now()
    });
  }
  return { title: spreadsheetTitle, rows };
}
function getCenterKeywords(name) {
  const clean = (name || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const tokens = clean.split(/\s+/).filter((t) => t.length > 1);
  const keywords = new Set(tokens);
  if (clean.includes("pcmc") || clean.includes("pimpri")) {
    keywords.add("pcmc");
    keywords.add("pimpri");
  }
  if (clean.includes("viman")) {
    keywords.add("viman");
    keywords.add("vimannagar");
  }
  if (clean.includes("hadapsar")) {
    keywords.add("hadapsar");
  }
  if (clean.includes("fc") || clean.includes("fergusson") || clean.includes("fcroad")) {
    keywords.add("fc");
    keywords.add("fcroad");
    keywords.add("fergusson");
  }
  if (clean.includes("kothrud") || clean.includes("kothurd")) {
    keywords.add("kothrud");
    keywords.add("kothurd");
  }
  if (clean.includes("tc") || clean.includes("tuition")) {
    keywords.add("tc");
    keywords.add("tuition");
  }
  if (clean.includes("vp") || clean.includes("vidyapeeth")) {
    keywords.add("vidyapeeth");
    keywords.add("vp");
  }
  return Array.from(keywords);
}
function doesSheetTitleMatchCenter(sheetTitle, centerName) {
  const titleClean = (sheetTitle || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const centerKeywords = getCenterKeywords(centerName);
  const primaryKeywords = ["pimpri", "pcmc", "viman", "hadapsar", "fcroad", "fergusson", "kothrud", "kothurd", "tuition"];
  for (const kw of primaryKeywords) {
    if (centerKeywords.includes(kw) && titleClean.includes(kw)) {
      return true;
    }
  }
  let matchCount = 0;
  for (const kw of centerKeywords) {
    if (kw !== "vp" && kw !== "vidyapeeth" && kw !== "pune" && titleClean.includes(kw)) {
      matchCount++;
    }
  }
  return matchCount > 0;
}
function normalizeDateStr(dateStr) {
  if (!dateStr) return "";
  let s = dateStr.trim().toUpperCase().replace(/[\/\.]/g, "-");
  s = s.replace(/\b0([1-9])\b/g, "$1");
  return s;
}
function isDateOrDayMatchingToday(rowDate, rowDay, todayDateStr, todayDayStr, nowIst) {
  const normRowDate = normalizeDateStr(rowDate);
  const normToday = normalizeDateStr(todayDateStr);
  const normRowDay = (rowDay || "").trim().toUpperCase().substring(0, 3);
  const normTodayDay = (todayDayStr || "").trim().toUpperCase().substring(0, 3);
  if (normRowDate && normToday) {
    if (normRowDate === normToday || normRowDate.includes(normToday) || normToday.includes(normRowDate)) {
      return true;
    }
    try {
      const parsed = new Date(rowDate);
      if (!isNaN(parsed.getTime())) {
        if (parsed.getDate() === nowIst.getDate() && parsed.getMonth() === nowIst.getMonth() && parsed.getFullYear() === nowIst.getFullYear()) {
          return true;
        }
      }
    } catch {
    }
    return false;
  }
  if (normRowDay && normTodayDay && normRowDay === normTodayDay) {
    return true;
  }
  return false;
}
function cleanBatchKey(str) {
  return (str || "").toUpperCase().replace(/VIDYAPEETH/g, "").replace(/TUITION/g, "").replace(/SIP/g, "").replace(/\b20\d{2}\b/g, "").replace(/\(\d+\)/g, "").replace(/[^A-Z0-9]/g, "");
}
function extractCoreBatchCode(str) {
  if (!str) return "";
  const clean = (str || "").toUpperCase();
  const m = clean.match(/\b(?:27-|S98-)?([A-Z]{2,4}\d{2,3}[A-Z0-9]{2,4})\b/);
  if (m) return m[1];
  const m2 = clean.match(/([A-Z]{2}\d{3}[A-Z]{2})/);
  if (m2) return m2[1];
  return clean.replace(/[^A-Z0-9]/g, "");
}
function isBatchMatch(rowBatch, rowBatchFaculty, targetBatch) {
  if (!targetBatch) return false;
  const targetCore = extractCoreBatchCode(targetBatch);
  const rowBatchCore = extractCoreBatchCode(rowBatch);
  const rowFacultyCore = extractCoreBatchCode(rowBatchFaculty);
  if (targetCore && rowBatchCore && targetCore === rowBatchCore) return true;
  if (targetCore && rowFacultyCore && targetCore === rowFacultyCore) return true;
  const targetClean = cleanBatchKey(targetBatch);
  const rowBatchClean = cleanBatchKey(rowBatch);
  if (targetClean && rowBatchClean && targetClean === rowBatchClean) return true;
  return false;
}
function getTeacherNameFromEmail(email) {
  if (!email || !email.includes("@")) return "";
  const prefix = email.split("@")[0].replace(/\d+$/, "");
  const parts = prefix.split(/[._-]/).filter(Boolean);
  if (parts.length === 0) return "";
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
}
function parseRawDbRows(rows) {
  if (!rows || rows.length < 2) return [];
  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const rCells = (rows[r] || []).map((c) => (c || "").toString().trim().toLowerCase());
    const hasDay = rCells.some((c) => c === "day" || c.includes("day"));
    const hasDateOrBatch = rCells.some((c) => c.includes("date") || c.includes("batch") || c.includes("start") || c.includes("time"));
    if (hasDay && hasDateOrBatch) {
      headerRowIdx = r;
      break;
    }
  }
  const dayIdx = 0;
  const dateIdx = 1;
  const startIdx = 2;
  const endIdx = 3;
  const batchFacultyIdx = 4;
  const timeIdx = 7;
  const batchCodeIdx = 8;
  const facultyCodeIdx = 9;
  const subjectIdx = 34;
  const teacherEmailIdx = 36;
  const { dateStr: todayDate, dayStr: todayDay, now } = getIstDateInfo();
  const result = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    let batchCode = (row[batchCodeIdx] || "").toString().trim();
    let batchFaculty = (row[batchFacultyIdx] || "").toString().trim();
    if (!batchCode && !batchFaculty) {
      for (let c = 0; c <= 11 && c < row.length; c++) {
        const val = (row[c] || "").toString().trim();
        if (val.match(/(?:27-|S98-|\b)[A-Z]{2,4}\d{2,3}[A-Z0-9]{2,4}/i)) {
          batchCode = val;
          break;
        }
      }
    }
    if (!batchCode && !batchFaculty) continue;
    let day = (row[dayIdx] || "").toString().trim();
    const lectureDate = (row[dateIdx] || "").toString().trim();
    if (!day && lectureDate) {
      try {
        const parsed = new Date(lectureDate);
        if (!isNaN(parsed.getTime())) {
          day = parsed.toLocaleDateString("en-US", { weekday: "short" });
        }
      } catch {
      }
    }
    const startTime = (row[startIdx] || "").toString().trim();
    const endTime = (row[endIdx] || "").toString().trim();
    const timeRange = (startTime && endTime ? `${startTime} - ${endTime}` : row[timeIdx] || "").toString().trim();
    const facultyCode = (row[facultyCodeIdx] || "").toString().trim();
    let subject = (row[subjectIdx] || "").toString().trim();
    if (!subject || subject.toLowerCase() === "general" || subject.toLowerCase() === "lecture") {
      const derived = getSubjectFromFacultyCode(facultyCode);
      if (derived) subject = derived;
    }
    let teacherEmail = (row[teacherEmailIdx] || "").toString().trim();
    if (!teacherEmail.includes("@")) teacherEmail = "";
    const isToday = isDateOrDayMatchingToday(lectureDate, day, todayDate, todayDay, now);
    const status = computeLectureStatus(startTime, endTime, isToday, now);
    const teacherName = getTeacherNameFromEmail(teacherEmail);
    result.push({
      day,
      lectureDate,
      startTime,
      endTime,
      timeRange,
      batchFaculty,
      batchCode,
      facultyCode,
      subject,
      teacherEmail,
      teacherName,
      isToday,
      status,
      rowIndex: i + 1
    });
  }
  return deduplicateLectures(result);
}
function getSubjectFromFacultyCode(fCode) {
  if (!fCode) return "";
  const first = fCode.trim().toUpperCase()[0];
  if (first === "P") return "Physics";
  if (first === "C") return "Chemistry";
  if (first === "M") return "Maths";
  if (first === "B") return "Botany";
  if (first === "Z") return "Zoology";
  if (first === "E") return "English";
  return "";
}
function filterCurrentOrLatestWeekLectures(lectures, todayIso) {
  if (!lectures || lectures.length === 0) return [];
  const currentYear = todayIso.substring(0, 4);
  const dateMap = /* @__PURE__ */ new Map();
  const isoDates = [];
  for (const lec of lectures) {
    if (lec.lectureDate) {
      const iso = parseDateToIso(lec.lectureDate, currentYear);
      if (iso) {
        dateMap.set(lec, iso);
        if (!isoDates.includes(iso)) isoDates.push(iso);
      }
    }
  }
  if (isoDates.length === 0) return lectures;
  isoDates.sort();
  const [ty, tm, td] = todayIso.split("-").map(Number);
  const todayObj = new Date(Date.UTC(ty, tm - 1, td, 12, 0, 0));
  const dayOfWeek = todayObj.getUTCDay();
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monObj = new Date(todayObj.getTime() + diffToMon * 864e5);
  const sunObj = new Date(monObj.getTime() + 6 * 864e5);
  const monIso = monObj.toISOString().substring(0, 10);
  const sunIso = sunObj.toISOString().substring(0, 10);
  const currentWeekLectures = lectures.filter((lec) => {
    const iso = dateMap.get(lec);
    if (!iso) return isoDates.length === 0;
    return iso >= monIso && iso <= sunIso;
  });
  const hasCurrentWeekDates = currentWeekLectures.some((l) => dateMap.has(l));
  if (hasCurrentWeekDates) {
    return currentWeekLectures;
  }
  const latestIso = isoDates[isoDates.length - 1];
  const [ly, lm, ld] = latestIso.split("-").map(Number);
  const latestObj = new Date(Date.UTC(ly, lm - 1, ld, 12, 0, 0));
  const lDay = latestObj.getUTCDay();
  const lDiffToMon = lDay === 0 ? -6 : 1 - lDay;
  const latestMon = new Date(latestObj.getTime() + lDiffToMon * 864e5);
  const latestSun = new Date(latestMon.getTime() + 6 * 864e5);
  const lMonIso = latestMon.toISOString().substring(0, 10);
  const lSunIso = latestSun.toISOString().substring(0, 10);
  return lectures.filter((lec) => {
    const iso = dateMap.get(lec);
    if (!iso) return isoDates.length === 0;
    return iso >= lMonIso && iso <= lSunIso;
  });
}
function deduplicateLectures(lectures) {
  const seen = /* @__PURE__ */ new Map();
  const normalizeTimeKey = (timeStr) => {
    if (!timeStr) return "";
    const standardized = timeStr.replace(/\b(\d):/g, "0$1:");
    return standardized.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  };
  for (const lec of lectures) {
    const cleanBatch = extractCoreBatchCode(lec.batchCode || lec.batchFaculty || "");
    const cleanDate = (lec.lectureDate || "").toString().trim().toUpperCase();
    const cleanDay = (lec.day || "").trim().toUpperCase().substring(0, 3);
    const cleanTime = normalizeTimeKey(lec.timeRange || `${lec.startTime}-${lec.endTime}`);
    const cleanSubject = (lec.subject || "").trim().toUpperCase();
    const cleanFaculty = (lec.facultyCode || "").trim().toUpperCase();
    const slotKey = `${cleanBatch}_${cleanDate || cleanDay}_${cleanTime}_${cleanSubject}_${cleanFaculty}`;
    if (!seen.has(slotKey)) {
      seen.set(slotKey, lec);
    } else {
      const existing = seen.get(slotKey);
      if (lec.isToday && !existing.isToday) {
        seen.set(slotKey, lec);
      } else if (lec.teacherEmail && !existing.teacherEmail) {
        seen.set(slotKey, lec);
      }
    }
  }
  return Array.from(seen.values());
}
var cachedBmMap = { ...SEED_BM_MAP };
var cachedBmMapTimestamp = Date.now();
var cachedBmMapSpreadsheetId = "";
var BM_MAP_CACHE_TTL = 15 * 60 * 1e3;
var batchesResponseCache = /* @__PURE__ */ new Map();
var BATCHES_RESPONSE_CACHE_TTL = 5 * 60 * 1e3;
function parseCSVLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}
async function resolveBmMap(sheets, spreadsheetId, authToken, forceRefresh = false) {
  if (!forceRefresh && cachedBmMapSpreadsheetId === spreadsheetId && Date.now() - cachedBmMapTimestamp < BM_MAP_CACHE_TTL) {
    return { ...cachedBmMap };
  }
  const bmMap = { ...SEED_BM_MAP, ...cachedBmMap || {} };
  const registerBm = (batchName, bmVal) => {
    if (!batchName || !bmVal) return;
    const cleanBm = bmVal.replace(/^["'\s]+|["'\s]+$/g, "").trim();
    if (!cleanBm.includes("@")) return;
    const upperRaw = batchName.trim().toUpperCase().replace(/\s+/g, " ");
    const stripped = upperRaw.replace(/VIDYAPEETH/gi, "").replace(/TUITION/gi, "").replace(/SIP/gi, "").replace(/\(MERGED\)/gi, "").trim().replace(/\s+/g, " ");
    const core = extractCode(batchName);
    const coreBatch = extractCoreBatchCode(batchName);
    bmMap[upperRaw] = cleanBm;
    if (stripped) {
      bmMap[stripped] = cleanBm;
      bmMap[`TUITION ${stripped}`] = cleanBm;
      bmMap[`VIDYAPEETH ${stripped}`] = cleanBm;
      bmMap[`SIP ${stripped}`] = cleanBm;
    }
    if (core) {
      bmMap[core] = cleanBm;
    }
    if (coreBatch) {
      bmMap[coreBatch] = cleanBm;
    }
  };
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=1006259505`;
    const fetchHeaders = {};
    if (authToken) {
      fetchHeaders["Authorization"] = `Bearer ${authToken}`;
    }
    const resp = await fetch(csvUrl, { headers: fetchHeaders });
    if (resp.ok) {
      const text = await resp.text();
      const lines = text.split("\n");
      if (lines.length > 0) {
        const header = parseCSVLine(lines[0]);
        let bIdx = -1;
        let bmIdx = -1;
        header.forEach((h, idx) => {
          const head = (h || "").toLowerCase().trim();
          if (bIdx === -1 && (head.includes("batch name") || head.includes("batch code") || head.includes("batch") && !head.includes("status"))) {
            bIdx = idx;
          }
          if (bmIdx === -1 && (head.includes("bm") || head.includes("manager") || head.includes("email"))) {
            bmIdx = idx;
          }
        });
        if (bIdx === -1) bIdx = 1;
        if (bmIdx === -1) bmIdx = 3;
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const cols = parseCSVLine(lines[i]);
          const rawBatch = (cols[bIdx] || "").trim();
          const bmVal = (cols[bmIdx] || "").trim();
          if (rawBatch && bmVal && bmVal.includes("@")) {
            registerBm(rawBatch, bmVal);
          }
        }
      }
    }
  } catch (csvErr) {
    console.warn("[BM Resolver] Direct CSV export failed:", csvErr.message);
  }
  if (Object.keys(bmMap).length === 0 && sheets) {
    try {
      const refRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Ref!A:H"
      });
      const refRows = refRes.data.values || [];
      if (refRows.length > 0) {
        const refHeader = refRows[0] || [];
        let refBatchIdx = -1;
        let refBmIdx = -1;
        refHeader.forEach((h, idx) => {
          const head = (h || "").toString().toLowerCase();
          if (refBatchIdx === -1 && (head.includes("batch") || head.includes("name"))) {
            refBatchIdx = idx;
          }
          if (refBmIdx === -1 && (head.includes("bm") || head.includes("manager") || head.includes("assign") || head.includes("email"))) {
            refBmIdx = idx;
          }
        });
        if (refBatchIdx === -1) refBatchIdx = 1;
        if (refBmIdx === -1) refBmIdx = 3;
        for (let i = 1; i < refRows.length; i++) {
          const rawFullName = refRows[i][refBatchIdx] ? refRows[i][refBatchIdx].toString().trim() : "";
          let bmVal = refRows[i][refBmIdx] ? refRows[i][refBmIdx].toString().trim() : "";
          if (!bmVal && refRows[i][2]) bmVal = refRows[i][2].toString().trim();
          if (!bmVal && refRows[i][4]) bmVal = refRows[i][4].toString().trim();
          if (rawFullName && bmVal && bmVal.includes("@")) {
            registerBm(rawFullName, bmVal);
          }
        }
      }
    } catch (err) {
      console.warn("[BM Resolver] API 'Ref' sheet reading failed:", err.message);
    }
  }
  try {
    const extraPayload = await fetchAllExtraClassLectures(sheets, false);
    if (extraPayload && Array.isArray(extraPayload.classes)) {
      for (const ec of extraPayload.classes) {
        if (ec.batchCode && ec.bmName && ec.bmName.includes("@")) {
          registerBm(ec.batchCode, ec.bmName);
        }
      }
    }
  } catch {
  }
  if (Object.keys(bmMap).length > 0) {
    cachedBmMap = bmMap;
    cachedBmMapTimestamp = Date.now();
    cachedBmMapSpreadsheetId = spreadsheetId;
  }
  return bmMap;
}
app.get("/api/batches", async (req, res) => {
  try {
    const auth = getGoogleAuth(req);
    const spreadsheetId = req.query.spreadsheetId || "1-OYeCl3SME14Jjk1CCxRAAho_jrvgji63fFunLZvKiM";
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    const cacheKey = `${spreadsheetId}:${token || ""}`;
    const cachedResponse = batchesResponseCache.get(cacheKey);
    if (cachedResponse && Date.now() - cachedResponse.timestamp < BATCHES_RESPONSE_CACHE_TTL) {
      return res.json(cachedResponse.data);
    }
    if (cachedResponse) batchesResponseCache.delete(cacheKey);
    const sheets = google.sheets({ version: "v4", auth });
    const bmMap = await resolveBmMap(sheets, spreadsheetId, token);
    const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsList = metaRes.data.sheets || [];
    const targetTabs = [];
    sheetsList.forEach((sheet) => {
      const name = sheet.properties?.title || "";
      if (name && name.trim().toLowerCase() !== "ref") {
        targetTabs.push(name);
      }
    });
    const batchesData = {};
    const masterBms = /* @__PURE__ */ new Set();
    const ranges = targetTabs.map((tabName) => `'${tabName.replace(/'/g, "''")}'!A:Z`);
    const batchValuesRes = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges
    });
    const valueRanges = batchValuesRes.data.valueRanges || [];
    for (let tabIndex = 0; tabIndex < targetTabs.length; tabIndex++) {
      const tabName = targetTabs[tabIndex];
      try {
        const rows = valueRanges[tabIndex]?.values || [];
        const sheetData = [];
        const headerRow = rows[0] || [];
        let batchCodeIdx = 0;
        let batchIdIdx = 1;
        let adminUrlIdx = 2;
        let pwUrlIdx = 3;
        let driveUrlIdx = 9;
        let matchStatusIdx = 10;
        headerRow.forEach((val, index) => {
          const cleanHeader = (val || "").toString().trim().toLowerCase();
          if (cleanHeader.includes("batch id") || cleanHeader === "batchid" || cleanHeader === "id") {
            batchIdIdx = index;
          } else if (cleanHeader.includes("batch code") || cleanHeader.includes("batch name") || cleanHeader === "code" || cleanHeader === "batch") {
            batchCodeIdx = index;
          } else if (cleanHeader.includes("admin url") || cleanHeader.includes("admin link") || cleanHeader === "admin") {
            adminUrlIdx = index;
          } else if (cleanHeader.includes("pw url") || cleanHeader.includes("app url") || cleanHeader.includes("pw app") || cleanHeader === "app") {
            pwUrlIdx = index;
          } else if (cleanHeader.includes("drive link") || cleanHeader.includes("drive url") || cleanHeader.includes("google drive") || cleanHeader === "drive") {
            driveUrlIdx = index;
          } else if (cleanHeader.includes("match status") || cleanHeader.includes("drive status") || cleanHeader === "status") {
            matchStatusIdx = index;
          }
        });
        const batchMap = /* @__PURE__ */ new Map();
        const orderedKeys = [];
        for (let i = 1; i < rows.length; i++) {
          const batchCode = rows[i][batchCodeIdx] ? rows[i][batchCodeIdx].toString().trim() : "";
          if (!batchCode) continue;
          let rawBatchId = rows[i][batchIdIdx] ? rows[i][batchIdIdx].toString().trim() : "";
          const adminUrl = rows[i][adminUrlIdx] ? rows[i][adminUrlIdx].toString().trim() : "";
          const pwUrl = rows[i][pwUrlIdx] ? rows[i][pwUrlIdx].toString().trim() : "";
          const driveUrl = rows[i][driveUrlIdx] ? rows[i][driveUrlIdx].toString().trim() : "";
          const matchStatus = rows[i][matchStatusIdx] ? rows[i][matchStatusIdx].toString().trim() : "";
          if (!rawBatchId) {
            const urlMatch = (adminUrl + " " + pwUrl).match(/[0-9a-f]{24}/i);
            if (urlMatch) rawBatchId = urlMatch[0];
          }
          const cleanCode = batchCode.trim();
          let finalDisplayName = cleanCode;
          const upperCode = cleanCode.toUpperCase();
          if (upperCode.startsWith("T")) {
            finalDisplayName = `Tuition ${cleanCode}`;
          } else if (upperCode.startsWith("S")) {
            finalDisplayName = `SIP ${cleanCode}`;
          } else {
            finalDisplayName = `Vidyapeeth ${cleanCode}`;
          }
          const lookupKey = batchCode.replace(/\s+/g, " ").toUpperCase();
          const strippedKey = lookupKey.replace(/VIDYAPEETH/gi, "").replace(/TUITION/gi, "").replace(/SIP/gi, "").replace(/\(MERGED\)/gi, "").trim().replace(/\s+/g, " ");
          const coreKey = extractCode(batchCode);
          const coreBatch = extractCoreBatchCode(batchCode);
          let bmEmail = bmMap[lookupKey] || bmMap[strippedKey] || bmMap[finalDisplayName.toUpperCase()] || bmMap[cleanCode.toUpperCase()] || bmMap[coreKey] || (coreBatch ? bmMap[coreBatch] : "") || "";
          if (!bmEmail && Array.isArray(rows[i])) {
            for (let col = 0; col < rows[i].length; col++) {
              const cellVal = (rows[i][col] || "").toString().trim();
              if (cellVal.includes("@pw.live")) {
                bmEmail = cellVal;
                break;
              }
            }
          }
          if (bmEmail) {
            masterBms.add(bmEmail);
          }
          const dedupeKey = rawBatchId ? `ID_${rawBatchId.toLowerCase()}` : `CODE_${extractCode(batchCode) || cleanCode.toUpperCase()}`;
          if (batchMap.has(dedupeKey)) {
            const existing = batchMap.get(dedupeKey);
            const prevNames = existing.previousNames || [];
            if (existing.fullName && existing.fullName !== batchCode && !prevNames.includes(existing.fullName)) {
              prevNames.push(existing.fullName);
            }
            const allRowIndices = existing.allRowIndices || [existing.rowIndex];
            if (!allRowIndices.includes(i + 1)) {
              allRowIndices.push(i + 1);
            }
            existing.fullName = batchCode;
            existing.displayName = finalDisplayName;
            existing.category = getCategory(batchCode);
            existing.phase = getPhase(batchCode);
            existing.timeSlot = getTimeSlot(batchCode);
            existing.rowIndex = i + 1;
            existing.allRowIndices = allRowIndices;
            existing.previousNames = prevNames;
            if (rawBatchId) existing.batchId = rawBatchId;
            if (adminUrl) existing.adminUrl = adminUrl;
            if (pwUrl) existing.pwUrl = pwUrl;
            if (driveUrl && driveUrl !== "Not Found") {
              existing.driveUrl = driveUrl;
            } else if (!existing.driveUrl && driveUrl) {
              existing.driveUrl = driveUrl;
            }
            if (matchStatus) existing.matchStatus = matchStatus;
            if (bmEmail) existing.bmEmail = bmEmail;
          } else {
            const newBatch = {
              fullName: batchCode,
              displayName: finalDisplayName,
              batchId: rawBatchId,
              previousNames: [],
              allRowIndices: [i + 1],
              bmEmail,
              adminUrl,
              pwUrl,
              driveUrl,
              matchStatus,
              category: getCategory(batchCode),
              phase: getPhase(batchCode),
              timeSlot: getTimeSlot(batchCode),
              tabName,
              rowIndex: i + 1
            };
            batchMap.set(dedupeKey, newBatch);
            orderedKeys.push(dedupeKey);
          }
        }
        sheetData.push(...orderedKeys.map((k) => batchMap.get(k)));
        batchesData[tabName] = sheetData;
      } catch (tabErr) {
        console.error(`Error reading tab ${tabName}:`, tabErr.message);
        batchesData[tabName] = [];
      }
    }
    const responsePayload = {
      batchesData,
      bms: Array.from(masterBms).sort()
    };
    batchesResponseCache.set(cacheKey, {
      data: responsePayload,
      timestamp: Date.now()
    });
    res.json(responsePayload);
  } catch (error) {
    console.error("API Error (get-batches):", error);
    const spreadsheetId = req.query.spreadsheetId || "1-OYeCl3SME14Jjk1CCxRAAho_jrvgji63fFunLZvKiM";
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    const cacheKey = `${spreadsheetId}:${token || ""}`;
    const staleResponse = batchesResponseCache.get(cacheKey);
    const isQuotaError = error?.code === 429 || /quota|rate limit|too many requests/i.test(error?.message || "");
    if (staleResponse && isQuotaError) {
      console.warn("[Batches] Serving stale cached data after Sheets read failure.");
      return res.json(staleResponse.data);
    }
    res.status(error.message.includes("Authorization") ? 401 : 500).json({
      error: error.message || "An error occurred while loading sheets data."
    });
  }
});
app.post("/api/scan/batch", async (req, res) => {
  try {
    const auth = getGoogleAuth(req);
    const { spreadsheetId, tabName, batchCode, rowIndex, allRowIndices } = req.body;
    if (!tabName || !batchCode || !rowIndex) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    const coreCode = batchCode.split("-").length > 1 ? batchCode.split("-")[1].split(" ")[0].replace(/[^A-Z0-9]/gi, "").toUpperCase() : batchCode.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const drive = google.drive({ version: "v3", auth });
    let matchedUrl = "";
    let matchedFolderName = "";
    const exactRes = await drive.files.list({
      q: `name contains '${coreCode}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name, webViewLink)",
      pageSize: 1
    });
    const files = exactRes.data.files || [];
    if (files.length > 0) {
      matchedUrl = files[0].webViewLink || "";
      matchedFolderName = files[0].name || "";
    }
    if (!matchedUrl && coreCode.length >= 5) {
      const looseCode = coreCode.slice(0, -2);
      const looseRes = await drive.files.list({
        q: `name contains '${looseCode}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: "files(id, name, webViewLink)",
        pageSize: 20
      });
      const looseFiles = looseRes.data.files || [];
      for (const lf of looseFiles) {
        const cleanLFName = (lf.name || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
        if (cleanLFName.includes(coreCode)) {
          matchedUrl = lf.webViewLink || "";
          matchedFolderName = lf.name || "";
          break;
        }
      }
    }
    const statusValue = matchedUrl ? `Found: ${matchedFolderName}` : `Missing: ${coreCode}`;
    const urlValue = matchedUrl || "Not Found";
    const sheets = google.sheets({ version: "v4", auth });
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tabName}'!1:1`
    });
    const headerRow = headerRes.data.values?.[0] || [];
    let driveUrlIdx = 9;
    let matchStatusIdx = 10;
    headerRow.forEach((val, index) => {
      const cleanHeader = (val || "").toString().trim().toLowerCase();
      if (cleanHeader.includes("drive link") || cleanHeader.includes("drive url") || cleanHeader.includes("google drive") || cleanHeader === "drive") {
        driveUrlIdx = index;
      } else if (cleanHeader.includes("match status") || cleanHeader.includes("drive status") || cleanHeader === "status") {
        matchStatusIdx = index;
      }
    });
    const driveLetter = indexToColLetter(driveUrlIdx);
    const statusLetter = indexToColLetter(matchStatusIdx);
    const targetRows = Array.isArray(allRowIndices) && allRowIndices.length > 0 ? allRowIndices : [rowIndex];
    for (const rIdx of targetRows) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${tabName}'!${driveLetter}${rIdx}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[urlValue]]
        }
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${tabName}'!${statusLetter}${rIdx}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[statusValue]]
        }
      });
    }
    res.json({
      driveUrl: urlValue,
      matchStatus: statusValue
    });
  } catch (error) {
    console.error("API Error (scan-batch):", error);
    res.status(error.message.includes("Authorization") ? 401 : 500).json({
      error: error.message || "An error occurred during Google Drive search."
    });
  }
});
app.post("/api/update-batch-links", async (req, res) => {
  try {
    const auth = getGoogleAuth(req);
    const { spreadsheetId, tabName, rowIndex, adminUrl, pwUrl, driveUrl, matchStatus, allRowIndices } = req.body;
    if (!tabName || !rowIndex) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    const sheets = google.sheets({ version: "v4", auth });
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tabName}'!1:1`
    });
    const headerRow = headerRes.data.values?.[0] || [];
    let adminUrlIdx = 2;
    let pwUrlIdx = 3;
    let driveUrlIdx = 9;
    let matchStatusIdx = 10;
    headerRow.forEach((val, index) => {
      const cleanHeader = (val || "").toString().trim().toLowerCase();
      if (cleanHeader.includes("admin url") || cleanHeader.includes("admin link") || cleanHeader === "admin") {
        adminUrlIdx = index;
      } else if (cleanHeader.includes("pw url") || cleanHeader.includes("app url") || cleanHeader.includes("pw app") || cleanHeader === "app") {
        pwUrlIdx = index;
      } else if (cleanHeader.includes("drive link") || cleanHeader.includes("drive url") || cleanHeader.includes("google drive") || cleanHeader === "drive") {
        driveUrlIdx = index;
      } else if (cleanHeader.includes("match status") || cleanHeader.includes("drive status") || cleanHeader === "status") {
        matchStatusIdx = index;
      }
    });
    const adminLetter = indexToColLetter(adminUrlIdx);
    const pwLetter = indexToColLetter(pwUrlIdx);
    const driveLetter = indexToColLetter(driveUrlIdx);
    const statusLetter = indexToColLetter(matchStatusIdx);
    const targetRows = Array.isArray(allRowIndices) && allRowIndices.length > 0 ? allRowIndices : [rowIndex];
    for (const rIdx of targetRows) {
      if (adminUrl !== void 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${tabName}'!${adminLetter}${rIdx}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[adminUrl || ""]]
          }
        });
      }
      if (pwUrl !== void 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${tabName}'!${pwLetter}${rIdx}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[pwUrl || ""]]
          }
        });
      }
      if (driveUrl !== void 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${tabName}'!${driveLetter}${rIdx}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[driveUrl || ""]]
          }
        });
      }
      if (matchStatus !== void 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${tabName}'!${statusLetter}${rIdx}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[matchStatus || ""]]
          }
        });
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error("API Error (update-batch-links):", error);
    res.status(error.message.includes("Authorization") ? 401 : 500).json({
      error: error.message || "An error occurred while updating the spreadsheet."
    });
  }
});
var extraClassCache = /* @__PURE__ */ new Map();
var EXTRA_CLASS_SPREADSHEET_ID = "1f5HNSsjR_08dDDVvFoqrG40SaKdxhgbRnhD8cp7gY_4";
var EXTRA_CLASS_CACHE_TTL = 5 * 60 * 1e3;
var EXTRA_CLASS_CENTERS = [
  { rawSheetTitle: "Hadapsar ", centerName: "Hadapsar", gid: "498958040" },
  { rawSheetTitle: "Viman Nagar", centerName: "Viman Nagar", gid: "917736581" },
  { rawSheetTitle: "Kothrud ", centerName: "Kothrud", gid: "2015026809" },
  { rawSheetTitle: "PCMC ", centerName: "PCMC", gid: "15540423" },
  { rawSheetTitle: "FC Road ", centerName: "FC Road", gid: "398485996" },
  { rawSheetTitle: "Osmanabad (Dharashiv - S-SIP)", centerName: "Osmanabad (Dharashiv - S-SIP)", gid: "1691470459" },
  { rawSheetTitle: "Pimple Saudagar", centerName: "Pimple Saudagar", gid: "4891040" }
];
function parseCsvRows(csvText) {
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let insideQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c !== "")) rows.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== "")) rows.push(currentRow);
  }
  return rows;
}
function parseDateToIso(rawDate, currentYearStr) {
  if (!rawDate) return null;
  const str = String(rawDate).trim();
  if (!str) return null;
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3].padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const monthMap = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    sept: "09",
    oct: "10",
    nov: "11",
    dec: "12"
  };
  const mmmMatch = str.match(/^(\d{1,2})[-/\s]+([a-zA-Z]{3,4})[-/\s]*(\d{2,4})?$/);
  if (mmmMatch) {
    const d = mmmMatch[1].padStart(2, "0");
    const monStr = mmmMatch[2].toLowerCase().substring(0, 3);
    const m = monthMap[monStr] || monthMap[mmmMatch[2].toLowerCase()];
    if (m) {
      let y = mmmMatch[3];
      if (!y) {
        y = currentYearStr;
      } else if (y.length === 2) {
        y = `20${y}`;
      }
      return `${y}-${m}-${d}`;
    }
  }
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, "0");
    const m = dmyMatch[2].padStart(2, "0");
    let y = dmyMatch[3];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }
  const num = Number(str);
  if (!isNaN(num) && num > 4e4 && num < 6e4) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const target = new Date(epoch.getTime() + num * 864e5);
    const y = target.getUTCFullYear();
    const m = String(target.getUTCMonth() + 1).padStart(2, "0");
    const d = String(target.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
}
async function fetchAllExtraClassLectures(sheets = null, forceRefresh = false) {
  const cacheKey = `extra-classes-${EXTRA_CLASS_SPREADSHEET_ID}`;
  const cached = extraClassCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < EXTRA_CLASS_CACHE_TTL) {
    return cached.data;
  }
  const ALLOWED_EXTRA_CLASS_CENTERS = [
    "Hadapsar",
    "Viman Nagar",
    "Kothrud",
    "PCMC",
    "FC Road",
    "Osmanabad (Dharashiv - S-SIP)",
    "Pimple Saudagar"
  ];
  let sheetResults = [];
  let fetchSuccess = false;
  try {
    const csvPromises = EXTRA_CLASS_CENTERS.map(async (c) => {
      const exportUrl = `https://docs.google.com/spreadsheets/d/${EXTRA_CLASS_SPREADSHEET_ID}/export?format=csv&gid=${c.gid}`;
      const resp = await fetch(exportUrl);
      if (!resp.ok) {
        throw new Error(`Failed to fetch CSV for ${c.centerName}: HTTP ${resp.status}`);
      }
      const text = await resp.text();
      const rows = parseCsvRows(text);
      return {
        sheetTitle: c.rawSheetTitle,
        centerName: c.centerName,
        rows
      };
    });
    sheetResults = await Promise.all(csvPromises);
    fetchSuccess = sheetResults.some((s) => s.rows && s.rows.length > 0);
  } catch (csvErr) {
    console.warn("[Extra Class] Direct CSV export failed, falling back to Google Sheets API:", csvErr.message);
  }
  if (!fetchSuccess && sheets) {
    try {
      const ranges = EXTRA_CLASS_CENTERS.map((s) => `'${s.rawSheetTitle}'!A1:P`);
      const batchRes = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: EXTRA_CLASS_SPREADSHEET_ID,
        ranges
      });
      const valueRanges = batchRes.data?.valueRanges || [];
      sheetResults = EXTRA_CLASS_CENTERS.map((s, idx) => ({
        sheetTitle: s.rawSheetTitle,
        centerName: s.centerName,
        rows: valueRanges[idx]?.values || []
      }));
      fetchSuccess = true;
    } catch (batchErr) {
      console.warn("[Extra Class] batchGet error:", batchErr.message);
      if (cached && cached.data) {
        console.log("[Extra Class] Serving stale cached data due to API limit.");
        return cached.data;
      }
    }
  }
  if (!fetchSuccess) {
    if (cached && cached.data) {
      console.log("[Extra Class] Serving cached data.");
      return cached.data;
    }
    throw new Error("Could not load extra class schedule.");
  }
  const now = /* @__PURE__ */ new Date();
  const todayIstParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
  const tomorrowDateObj = new Date(now.getTime() + 24 * 60 * 60 * 1e3);
  const tomorrowIstParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(tomorrowDateObj);
  const yesterdayDateObj = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
  const yesterdayIstParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(yesterdayDateObj);
  const currentYearStr = todayIstParts.split("-")[0];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formatIsoDisplay = (iso) => {
    const [y, m, d] = iso.split("-");
    return `${d}-${monthNames[parseInt(m, 10) - 1]}-${y}`;
  };
  const todayDisplay = formatIsoDisplay(todayIstParts);
  const tomorrowDisplay = formatIsoDisplay(tomorrowIstParts);
  const yesterdayDisplay = formatIsoDisplay(yesterdayIstParts);
  const allLectures = [];
  const centersFound = /* @__PURE__ */ new Set();
  for (const { sheetTitle, centerName, rows } of sheetResults) {
    if (!rows || rows.length === 0) continue;
    centersFound.add(centerName);
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const nonEmpty = (rows[i] || []).filter((c) => String(c || "").trim() !== "");
      if (nonEmpty.length >= 2) {
        headerRowIdx = i;
        break;
      }
    }
    const headerRow = (rows[headerRowIdx] || []).map((h) => String(h || "").trim().toLowerCase());
    let batchCol = 0;
    let dayCol = 1;
    let dateCol = 2;
    let facultyCol = 3;
    let inTimeCol = 4;
    let outTimeCol = 5;
    let classTypeCol = 6;
    let teacherCol = 7;
    let subjectCol = 8;
    let bmCol = 9;
    let announcementCol = 10;
    let roomCol = 11;
    let statusCol = 14;
    headerRow.forEach((h, idx) => {
      if (h.includes("batch")) batchCol = idx;
      else if (h.includes("day")) dayCol = idx;
      else if (h.includes("date")) dateCol = idx;
      else if (h.includes("faculty") && !h.includes("name")) facultyCol = idx;
      else if (h.includes("in time") || h.includes("start") || h === "in") inTimeCol = idx;
      else if (h.includes("out time") || h.includes("end") || h === "out") outTimeCol = idx;
      else if (h.includes("doubts") || h.includes("test") || h.includes("class type")) classTypeCol = idx;
      else if (h.includes("teacher") || h.includes("faculty") && h.includes("name")) teacherCol = idx;
      else if (h.includes("subject")) subjectCol = idx;
      else if (h.includes("bm") || h.includes("manager")) bmCol = idx;
      else if (h.includes("room")) roomCol = idx;
      if (h.includes("announcement") && h.includes("status")) {
        statusCol = idx;
      } else if (h.includes("announcement") || h.includes("message")) {
        announcementCol = idx;
      } else if (h.includes("status") && !h.includes("cancel")) {
        statusCol = idx;
      }
    });
    const statusColLetter = indexToColLetter(statusCol);
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r] || [];
      const batchRaw = String(row[batchCol] || "").trim();
      if (!batchRaw) continue;
      if (batchRaw.toLowerCase().includes("batch") && batchRaw.toLowerCase().includes("code")) continue;
      let day = String(row[dayCol] || "").trim();
      const rawDate = String(row[dateCol] || "").trim();
      const facultyCode = String(row[facultyCol] || "").trim();
      const inTime = String(row[inTimeCol] || "").trim();
      const outTime = String(row[outTimeCol] || "").trim();
      const classType = String(row[classTypeCol] || "").trim();
      const teacherName = String(row[teacherCol] || "").trim();
      const subject = String(row[subjectCol] || "").trim();
      const bmName = String(row[bmCol] || "").trim();
      let announcement = String(row[announcementCol] || "").trim();
      const room = String(row[roomCol] || "").trim();
      const rawStatus = String(row[statusCol] || "").trim();
      const statusLower = rawStatus.toLowerCase();
      const isDone = statusLower === "done" || statusLower.startsWith("done") || statusLower.includes("done");
      const isoDate = parseDateToIso(rawDate, currentYearStr);
      let displayDate = rawDate;
      let isToday = false;
      let isTomorrow = false;
      let isYesterday = false;
      let isPast = false;
      let isUpcoming = false;
      if (isoDate) {
        displayDate = formatIsoDisplay(isoDate);
        if (isoDate === todayIstParts) {
          isToday = true;
        } else if (isoDate === tomorrowIstParts) {
          isTomorrow = true;
        } else if (isoDate === yesterdayIstParts) {
          isYesterday = true;
          isPast = true;
        } else if (isoDate < todayIstParts) {
          isPast = true;
        } else {
          isUpcoming = true;
        }
        if (!day) {
          try {
            const [y, m, d] = isoDate.split("-").map(Number);
            const dObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
            day = dObj.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
          } catch {
          }
        }
      } else {
        const lowerDate = rawDate.toLowerCase();
        if (lowerDate.includes("today")) isToday = true;
        else if (lowerDate.includes("tomorrow")) isTomorrow = true;
        else if (lowerDate.includes("yesterday")) {
          isYesterday = true;
          isPast = true;
        }
      }
      if (!announcement) {
        announcement = `Dear Vidyapeeth Students, ${teacherName || facultyCode || "Faculty"} Sir/Ma'am will take ${classType || "Extra Class"} of ${subject || "Special Subject"} at (${displayDate || rawDate}) at (${inTime || "TBD"} to ${outTime || "TBD"}). Don't forget to join! Keep studying! Physics Wallah is for you, by you, from you!`;
      }
      const category = getCategory(batchRaw);
      const phase = getPhase(batchRaw);
      const timeSlot = getTimeSlot(batchRaw);
      allLectures.push({
        id: `${sheetTitle}_${r + 1}`,
        spreadsheetId: EXTRA_CLASS_SPREADSHEET_ID,
        sheetTitle,
        center: centerName,
        rowIndex: r + 1,
        statusColLetter,
        batchCode: batchRaw,
        formattedBatchName: batchRaw.toUpperCase().startsWith("VIDYAPEETH") || batchRaw.toUpperCase().startsWith("TUITION") || batchRaw.toUpperCase().startsWith("SIP") ? batchRaw : batchRaw.toUpperCase().startsWith("T") ? `Tuition ${batchRaw}` : batchRaw.toUpperCase().startsWith("S") ? `SIP ${batchRaw}` : `Vidyapeeth ${batchRaw}`,
        category,
        phase,
        timeSlot,
        day,
        rawDate,
        isoDate,
        displayDate,
        facultyCode,
        inTime,
        outTime,
        timeRange: inTime && outTime ? `${inTime} - ${outTime}` : inTime || outTime || "Time TBA",
        classType: classType || "Extra Lecture",
        teacherName,
        subject,
        bmName,
        announcement,
        room: room ? room.toLowerCase().startsWith("room") ? room : `Room ${room}` : "Room TBA",
        rawStatus,
        isDone,
        isToday,
        isTomorrow,
        isYesterday,
        isPast,
        isUpcoming
      });
    }
  }
  const yesterdayCount = allLectures.filter((c) => c.isYesterday).length;
  const todayCount = allLectures.filter((c) => c.isToday).length;
  const tomorrowCount = allLectures.filter((c) => c.isTomorrow).length;
  const upcomingCount = allLectures.filter((c) => c.isUpcoming).length;
  const pastCount = allLectures.filter((c) => c.isPast).length;
  const doneCount = allLectures.filter((c) => c.isDone).length;
  const pendingCount = allLectures.filter((c) => !c.isDone).length;
  const responsePayload = {
    todayDate: todayIstParts,
    tomorrowDate: tomorrowIstParts,
    yesterdayDate: yesterdayIstParts,
    todayDateDisplay: todayDisplay,
    tomorrowDateDisplay: tomorrowDisplay,
    yesterdayDateDisplay: yesterdayDisplay,
    centers: ALLOWED_EXTRA_CLASS_CENTERS,
    classes: allLectures,
    counts: {
      yesterday: yesterdayCount,
      today: todayCount,
      tomorrow: tomorrowCount,
      upcoming: upcomingCount,
      past: pastCount,
      pending: pendingCount,
      done: doneCount,
      total: allLectures.length
    }
  };
  extraClassCache.set(cacheKey, {
    data: responsePayload,
    timestamp: Date.now()
  });
  return responsePayload;
}
var AUDIT_SPREADSHEET_ID = "1ZXz1LySgzYL06gNbM7N8jCbnTOyVGiHQ0I596F-Sq_k";
var auditSheetCache = /* @__PURE__ */ new Map();
function isPuneBatchCode(str) {
  if (!str) return false;
  const clean = str.trim().toUpperCase();
  return clean.startsWith("27-") || clean.startsWith("T27") || clean.startsWith("T-27") || clean.startsWith("27 -") || clean.includes("27-") || clean.includes("T27") || clean.includes("T-27") || clean.includes("27 -") || /\b(27-|T27)/i.test(clean);
}
function normalizePuneBranchName(branch) {
  const b = (branch || "").trim();
  const lower = b.toLowerCase();
  if (lower.includes("pcmc") || lower.includes("pimpri")) return "PCMC VP";
  if (lower.includes("hadapsar")) return "HADAPSAR";
  if (lower.includes("viman")) return "VIMAN NAGAR VP";
  if (lower.includes("fc") || lower.includes("fergusson")) return "FC ROAD";
  if (lower.includes("kothrud") || lower.includes("kothurd")) return "KOTHRUD";
  if (lower.includes("tc") || lower.includes("tuition")) return "TC";
  return b || "Pune Center";
}
function formatAuditDateTime(val) {
  if (!val) return "";
  const s = String(val).trim();
  if (!s) return "";
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const isoMatch = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const monthStr = monthNames[month] || String(month + 1);
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    if (isoMatch[4] !== void 0 && isoMatch[5] !== void 0) {
      let hour = parseInt(isoMatch[4], 10);
      const min = isoMatch[5];
      const ampm = hour >= 12 ? "PM" : "AM";
      hour = hour % 12;
      if (hour === 0) hour = 12;
      const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
      return `${dayStr}-${monthStr}-${year} \u2022 ${hourStr}:${min} ${ampm}`;
    }
    return `${dayStr}-${monthStr}-${year}`;
  }
  const ddmmyyyyMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
    const year = ddmmyyyyMatch[3];
    const monthStr = monthNames[month] || String(month + 1);
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    if (ddmmyyyyMatch[4] !== void 0 && ddmmyyyyMatch[5] !== void 0) {
      let hour = parseInt(ddmmyyyyMatch[4], 10);
      const min = ddmmyyyyMatch[5];
      const ampm = hour >= 12 ? "PM" : "AM";
      hour = hour % 12;
      if (hour === 0) hour = 12;
      const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
      return `${dayStr}-${monthStr}-${year} \u2022 ${hourStr}:${min} ${ampm}`;
    }
    return `${dayStr}-${monthStr}-${year}`;
  }
  const timeMatch = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const min = timeMatch[2];
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
    return `${hourStr}:${min} ${ampm}`;
  }
  return s;
}
function isTrivialAuditClean(val) {
  if (!val) return true;
  const lower = val.toLowerCase().trim();
  const cleanKeywords = [
    "no",
    "none",
    "nil",
    "ok",
    "clean",
    "done",
    "na",
    "n/a",
    "-",
    "--",
    "false",
    "true",
    "no issue",
    "no issues",
    "no error",
    "no errors",
    "all ok",
    "good",
    "resolved",
    "completed",
    "yes",
    "none reported"
  ];
  return cleanKeywords.includes(lower);
}
function isExplicitAuditIssue(val) {
  if (!val || isTrivialAuditClean(val)) return false;
  const lower = val.toLowerCase();
  const problemKeywords = [
    "wrong",
    "issue",
    "error",
    "not uploaded",
    "missing",
    "delay",
    "fault",
    "problem",
    "incorrect",
    "pendency",
    "pending",
    "failed",
    "reschedule",
    "cancel",
    "mismatch",
    "defect",
    "quiz"
  ];
  return problemKeywords.some((kw) => lower.includes(kw));
}
async function fetchAuditSheetWithCache(sheets, forceRefresh = false) {
  const cacheKey = `audit-sheet-${AUDIT_SPREADSHEET_ID}`;
  const cached = auditSheetCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < 3 * 60 * 1e3) {
    return cached.data;
  }
  if (!sheets) {
    if (cached && cached.data) return cached.data;
    return { records: [], totalPuneCount: 0, errorCount: 0, branches: [], subsheets: [] };
  }
  const metaRes = await sheets.spreadsheets.get({
    spreadsheetId: AUDIT_SPREADSHEET_ID
  });
  const allSheets = metaRes.data.sheets || [];
  const spreadsheetTitle = metaRes.data.properties?.title || "Audit Sheet";
  const TARGET_SUBSHEETS = ["pendency", "topic", "video", "notes", "content", "teacher"];
  const matchedSheets = allSheets.filter((s) => {
    const title = (s.properties?.title || "").trim().toLowerCase();
    return TARGET_SUBSHEETS.some((target) => title.includes(target));
  });
  const sheetsToQuery = matchedSheets.length > 0 ? matchedSheets : allSheets.slice(0, 8);
  const sheetDataResults = await Promise.all(
    sheetsToQuery.map(async (sheet) => {
      const sheetTitle = sheet.properties?.title || "Sheet1";
      try {
        const valRes = await sheets.spreadsheets.values.get({
          spreadsheetId: AUDIT_SPREADSHEET_ID,
          range: `'${sheetTitle}'!A1:ZZ`
        });
        return {
          sheetTitle,
          rows: valRes.data.values || []
        };
      } catch (err) {
        console.warn(`[Audit Sheet] Error fetching sheet '${sheetTitle}':`, err.message);
        return { sheetTitle, rows: [] };
      }
    })
  );
  const allPuneRecords = [];
  const branchesSet = /* @__PURE__ */ new Set();
  const subsheetsFound = [];
  for (const { sheetTitle, rows } of sheetDataResults) {
    if (!rows || rows.length < 2) continue;
    subsheetsFound.push(sheetTitle);
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const nonEmpty = (rows[i] || []).filter((c) => String(c || "").trim() !== "");
      if (nonEmpty.length >= 2) {
        headerRowIndex = i;
        break;
      }
    }
    const headerRow = (rows[headerRowIndex] || []).map((h) => String(h || "").trim());
    let branchIdx = -1;
    let batchIdx = -1;
    let subjectIdx = -1;
    let timeIdx = -1;
    let bmIdx = -1;
    const issueColIndices = [];
    const statusColIndices = [];
    headerRow.forEach((colHeader, idx) => {
      const rawH = colHeader.toLowerCase().trim();
      const hAlpha = rawH.replace(/[^a-z0-9]/g, "");
      const hSpaced = rawH.replace(/[^a-z0-9]/g, " ");
      if (branchIdx === -1 && (hAlpha.includes("branch") || hAlpha.includes("center") || hAlpha.includes("centre") || hAlpha.includes("location"))) {
        branchIdx = idx;
      } else if (batchIdx === -1 && (hAlpha.includes("batchname") || hAlpha.includes("batchcode") || hAlpha.includes("batch") && !hAlpha.includes("manager") && !hAlpha.includes("bm"))) {
        batchIdx = idx;
      } else if (subjectIdx === -1 && (hAlpha.includes("subjectname") || hAlpha.includes("subject") || hAlpha === "sub")) {
        subjectIdx = idx;
      } else if (timeIdx === -1 && (hAlpha.includes("lecstart") || hAlpha.includes("starttime") || hAlpha.includes("lectime") || hAlpha.includes("startdate") || hAlpha.includes("lecdate") || hSpaced.includes("lec start") || hSpaced.includes("start time") || hSpaced.includes("lecture time") || hSpaced.includes("in time") || hAlpha === "time" || hAlpha === "timing" || hAlpha.includes("slot"))) {
        timeIdx = idx;
      } else if (bmIdx === -1 && (hAlpha.includes("finalbm") || hAlpha.includes("batchmanager") || hAlpha === "bm" || hAlpha.includes("bmname") || hAlpha.includes("manager") && !hAlpha.includes("batch"))) {
        bmIdx = idx;
      }
      if (hAlpha.includes("issue") || hAlpha.includes("error") || hAlpha.includes("remark") || hAlpha.includes("problem") || hAlpha.includes("pendency") || hAlpha.includes("defect")) {
        issueColIndices.push(idx);
      } else if (hAlpha.includes("status") || hAlpha.includes("verification") || hAlpha.includes("audit") || hAlpha.includes("uploaded") || hAlpha.includes("notes") || hAlpha.includes("video")) {
        statusColIndices.push(idx);
      }
    });
    for (let r = headerRowIndex + 1; r < rows.length; r++) {
      const row = rows[r] || [];
      if (!row || row.length === 0) continue;
      const rawBranch = branchIdx >= 0 ? String(row[branchIdx] || "").trim() : "";
      let rawBatch = batchIdx >= 0 ? String(row[batchIdx] || "").trim() : "";
      let finalBatchName = "";
      if (isPuneBatchCode(rawBatch)) {
        finalBatchName = rawBatch;
      } else {
        for (let c = 0; c < row.length; c++) {
          const cellStr = String(row[c] || "").trim();
          if (isPuneBatchCode(cellStr)) {
            finalBatchName = cellStr;
            break;
          }
        }
      }
      if (!finalBatchName) continue;
      let normalizedBranch = "";
      const batchUpper = finalBatchName.toUpperCase();
      if (batchUpper.startsWith("T27") || batchUpper.includes("T27")) {
        normalizedBranch = "TC";
      } else if (rawBranch && rawBranch.toLowerCase() !== "pune") {
        normalizedBranch = normalizePuneBranchName(rawBranch);
      } else {
        normalizedBranch = "Pune Center";
      }
      branchesSet.add(normalizedBranch);
      const rawSubject = subjectIdx >= 0 ? String(row[subjectIdx] || "").trim() : "";
      const rawTime = timeIdx >= 0 ? String(row[timeIdx] || "").trim() : "";
      const formattedLecTime = formatAuditDateTime(rawTime);
      const rawBm = bmIdx >= 0 ? String(row[bmIdx] || "").trim() : "";
      const gatheredIssues = [];
      for (const idx of issueColIndices) {
        const val = String(row[idx] || "").trim();
        if (val && !isTrivialAuditClean(val)) {
          if (!gatheredIssues.some((g) => g.toLowerCase() === val.toLowerCase())) {
            gatheredIssues.push(val);
          }
        }
      }
      if (gatheredIssues.length === 0) {
        for (const idx of statusColIndices) {
          const val = String(row[idx] || "").trim();
          if (val && !isTrivialAuditClean(val)) {
            if (!gatheredIssues.some((g) => g.toLowerCase() === val.toLowerCase())) {
              gatheredIssues.push(val);
            }
          }
        }
      }
      if (gatheredIssues.length === 0) {
        for (let c = 0; c < row.length; c++) {
          if (c === branchIdx || c === batchIdx || c === subjectIdx || c === timeIdx || c === bmIdx) continue;
          const cellVal = String(row[c] || "").trim();
          if (cellVal && isExplicitAuditIssue(cellVal)) {
            gatheredIssues.push(cellVal);
            break;
          }
        }
      }
      const rawError = gatheredIssues.join(" \u2022 ");
      const hasError = gatheredIssues.length > 0;
      const rawRowObj = {};
      headerRow.forEach((colHeader, colIdx) => {
        const key = colHeader || `Column_${colIdx + 1}`;
        rawRowObj[key] = String(row[colIdx] || "").trim();
      });
      allPuneRecords.push({
        id: `${sheetTitle}_${r + 1}`,
        subsheet: sheetTitle,
        branch: normalizedBranch,
        batchName: finalBatchName,
        subjectName: rawSubject,
        lecStartTime: formattedLecTime || rawTime,
        finalBm: rawBm,
        errors: rawError,
        hasError,
        rowIndex: r + 1,
        rawRow: rawRowObj
      });
    }
  }
  const totalPuneCount = allPuneRecords.length;
  const errorCount = allPuneRecords.filter((r) => r.hasError).length;
  const payload = {
    spreadsheetId: AUDIT_SPREADSHEET_ID,
    spreadsheetTitle,
    subsheets: subsheetsFound,
    totalPuneCount,
    errorCount,
    branches: Array.from(branchesSet).sort(),
    records: allPuneRecords
  };
  auditSheetCache.set(cacheKey, {
    data: payload,
    timestamp: Date.now()
  });
  return payload;
}
app.get("/api/timetable/batch-schedule", async (req, res) => {
  try {
    const auth = getGoogleAuth(req);
    const center = req.query.center || "";
    const batchCode = req.query.batchCode || "";
    let spreadsheetId = req.query.spreadsheetId || "";
    const forceRefresh = req.query.forceRefresh === "true";
    const searchAll = req.query.searchAll === "true" || !center || center === "ALL";
    if (!batchCode) {
      return res.status(400).json({ error: "Missing required query parameter: batchCode" });
    }
    const sheets = google.sheets({ version: "v4", auth });
    let spreadsheetTitle = "";
    let foundLectures = [];
    let resolvedCenter = center || "";
    let candidateId = spreadsheetId;
    if (!searchAll) {
      if (!candidateId && center && centerTimetableMap[center]?.spreadsheetId) {
        candidateId = centerTimetableMap[center].spreadsheetId;
        spreadsheetTitle = centerTimetableMap[center].spreadsheetTitle || "";
      }
      if (candidateId) {
        try {
          const { title, rows } = await fetchRawDbWithCache(sheets, candidateId, forceRefresh);
          spreadsheetTitle = title;
          const parsed = parseRawDbRows(rows);
          const matches = parsed.filter((l) => isBatchMatch(l.batchCode, l.batchFaculty, batchCode));
          if (matches.length > 0) {
            foundLectures = matches;
            spreadsheetId = candidateId;
            resolvedCenter = center;
          }
        } catch (err) {
          console.warn(`Error querying candidate sheet ${candidateId}:`, err.message);
        }
      }
    }
    if (foundLectures.length === 0) {
      const sheetsToSearch = !searchAll && candidateId ? TIMETABLE_SHEET_IDS.filter((id) => id !== candidateId) : TIMETABLE_SHEET_IDS;
      const results = await Promise.all(
        sheetsToSearch.map(async (sId) => {
          try {
            const { title, rows } = await fetchRawDbWithCache(sheets, sId, forceRefresh);
            const parsed = parseRawDbRows(rows);
            const matches = parsed.filter((l) => isBatchMatch(l.batchCode, l.batchFaculty, batchCode));
            return { sId, title, matches, totalParsed: parsed.length };
          } catch (err) {
            return { sId, title: sId, matches: [], totalParsed: 0 };
          }
        })
      );
      let bestResult = results.find(
        (r) => r.matches.length > 0 && center && doesSheetTitleMatchCenter(r.title, center)
      );
      if (!bestResult) {
        const candidates = results.filter((r) => r.matches.length > 0).sort((a, b) => b.matches.length - a.matches.length);
        bestResult = candidates[0];
      }
      if (bestResult && bestResult.matches.length > 0) {
        foundLectures = bestResult.matches;
        spreadsheetId = bestResult.sId;
        spreadsheetTitle = bestResult.title;
        const knownCenters = ["PCMC VP", "HADAPSAR", "VIMAN NAGAR VP", "TC", "FC ROAD", "KOTHURD"];
        for (const [cName, cMap] of Object.entries(centerTimetableMap)) {
          if (cMap.spreadsheetId === bestResult.sId) {
            resolvedCenter = cName;
            break;
          }
        }
        if (!resolvedCenter) {
          for (const kc of knownCenters) {
            if (doesSheetTitleMatchCenter(bestResult.title, kc)) {
              resolvedCenter = kc;
              break;
            }
          }
        }
        if (!resolvedCenter) {
          resolvedCenter = bestResult.title || "Pune Center";
        }
      } else {
        if (!spreadsheetId) {
          for (const r of results) {
            if (center && doesSheetTitleMatchCenter(r.title, center)) {
              spreadsheetId = r.sId;
              spreadsheetTitle = r.title;
              break;
            }
          }
          if (!spreadsheetId) {
            spreadsheetId = candidateId || TIMETABLE_SHEET_IDS[0];
          }
        }
      }
    }
    let matchingExtraClasses = [];
    try {
      const extraPayload = await fetchAllExtraClassLectures(sheets, forceRefresh);
      const allMatchingExtra = (extraPayload.classes || []).filter(
        (ec) => isBatchMatch(ec.batchCode, "", batchCode)
      );
      const relevantExtra = allMatchingExtra.filter(
        (ec) => ec.isYesterday || ec.isToday || ec.isTomorrow
      );
      const dateOrder = (item) => {
        if (item.isYesterday) return 1;
        if (item.isToday) return 2;
        if (item.isTomorrow) return 3;
        return 4;
      };
      relevantExtra.sort((a, b) => {
        const orderDiff = dateOrder(a) - dateOrder(b);
        if (orderDiff !== 0) return orderDiff;
        return (a.inTime || "").localeCompare(b.inTime || "");
      });
      matchingExtraClasses = relevantExtra.map((ec) => {
        let dateTag = "TODAY";
        if (ec.isYesterday) dateTag = "YESTERDAY";
        else if (ec.isTomorrow) dateTag = "TOMORROW";
        return {
          id: ec.id,
          center: ec.center,
          batchCode: ec.batchCode,
          day: ec.day,
          date: ec.displayDate || ec.rawDate,
          timeRange: ec.timeRange,
          teacherName: ec.teacherName || ec.facultyCode || "Faculty",
          subject: ec.subject || "Extra Lecture",
          room: ec.room || "Room TBA",
          announcement: ec.announcement || "",
          announcementStatus: ec.rawStatus || (ec.isDone ? "Done" : "Pending"),
          isDone: !!ec.isDone,
          isToday: !!ec.isToday,
          isTomorrow: !!ec.isTomorrow,
          isYesterday: !!ec.isYesterday,
          isUpcoming: !!ec.isUpcoming,
          isPast: !!ec.isPast,
          dateTag
        };
      });
    } catch (extraErr) {
      console.warn("Could not query extra class sheet for batch-schedule:", extraErr.message);
    }
    let matchingAuditIssues = [];
    try {
      if (sheets) {
        const auditPayload = await fetchAuditSheetWithCache(sheets, forceRefresh);
        if (auditPayload && Array.isArray(auditPayload.records)) {
          matchingAuditIssues = auditPayload.records.filter((r) => isBatchMatch(r.batchName, "", batchCode)).map((r) => ({
            id: r.id,
            subsheet: r.subsheet,
            branch: r.branch,
            batchName: r.batchName,
            subjectName: r.subjectName,
            lecStartTime: r.lecStartTime,
            finalBm: r.finalBm,
            errors: r.errors || "Issue pending verification",
            hasError: !!r.hasError
          }));
        }
      }
    } catch (auditErr) {
      console.warn("Could not query audit sheet for batch-schedule:", auditErr.message);
    }
    const { now, dateStr: todayDate, dayStr: todayDay } = getIstDateInfo();
    const currentYearStr = String(now.getFullYear());
    const todayIso = parseDateToIso(todayDate, currentYearStr) || now.toISOString().substring(0, 10);
    foundLectures = filterCurrentOrLatestWeekLectures(foundLectures, todayIso);
    foundLectures = deduplicateLectures(foundLectures);
    const dayWeight = {
      MON: 1,
      TUE: 2,
      WED: 3,
      THU: 4,
      FRI: 5,
      SAT: 6,
      SUN: 7
    };
    foundLectures.sort((a, b) => {
      const aD = (a.day || "").trim().substring(0, 3).toUpperCase();
      const bD = (b.day || "").trim().substring(0, 3).toUpperCase();
      const wA = dayWeight[aD] || 99;
      const wB = dayWeight[bD] || 99;
      if (wA !== wB) return wA - wB;
      return (a.startTime || "").localeCompare(b.startTime || "");
    });
    const todayLectures = foundLectures.filter((l) => l.isToday);
    const daysSet = /* @__PURE__ */ new Set();
    foundLectures.forEach((l) => {
      if (l.day) daysSet.add(l.day);
    });
    res.json({
      center: resolvedCenter || center || "Pune Center",
      batchCode,
      spreadsheetId,
      spreadsheetTitle,
      todayDate,
      todayDay,
      todayLectures,
      allLectures: foundLectures,
      daysAvailable: Array.from(daysSet),
      totalWeeklyLectures: foundLectures.length,
      extraClasses: matchingExtraClasses,
      auditIssues: matchingAuditIssues
    });
  } catch (error) {
    console.error("API Error (batch-schedule):", error);
    res.status(error.message.includes("Authorization") ? 401 : 500).json({
      error: error.message || "Failed to fetch batch schedule from Raw_DB."
    });
  }
});
app.get("/api/timetable/mappings", async (req, res) => {
  try {
    const auth = getGoogleAuth(req);
    const sheets = google.sheets({ version: "v4", auth });
    const centers = req.query.centers?.split(",").filter(Boolean) || [];
    const sheetsMeta = await Promise.all(
      TIMETABLE_SHEET_IDS.map(async (sId) => {
        try {
          const metaRes = await sheets.spreadsheets.get({
            spreadsheetId: sId,
            fields: "properties.title"
          });
          return { sId, title: metaRes.data?.properties?.title || sId };
        } catch {
          return { sId, title: sId };
        }
      })
    );
    for (const c of centers) {
      if (!centerTimetableMap[c] || centerTimetableMap[c].matchedConfidence === "unassigned") {
        const match = sheetsMeta.find((meta) => doesSheetTitleMatchCenter(meta.title, c));
        if (match) {
          centerTimetableMap[c] = {
            centerName: c,
            spreadsheetId: match.sId,
            spreadsheetTitle: match.title,
            hasRawDb: true,
            matchedConfidence: "high"
          };
        }
      }
    }
    res.json({
      mappings: centerTimetableMap,
      availableSheets: sheetsMeta
    });
  } catch (error) {
    console.error("API Error (timetable-mappings):", error);
    res.status(500).json({ error: error.message || "Failed to load timetable mappings." });
  }
});
app.post("/api/timetable/mappings", async (req, res) => {
  try {
    const { centerName, spreadsheetId, spreadsheetTitle } = req.body;
    if (!centerName || !spreadsheetId) {
      return res.status(400).json({ error: "centerName and spreadsheetId are required." });
    }
    centerTimetableMap[centerName] = {
      centerName,
      spreadsheetId,
      spreadsheetTitle: spreadsheetTitle || centerName,
      hasRawDb: true,
      matchedConfidence: "manual"
    };
    res.json({ success: true, mapping: centerTimetableMap[centerName] });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to update timetable mapping." });
  }
});
var customModuleCache = /* @__PURE__ */ new Map();
var CUSTOM_MODULE_MAP = {
  "extra-class": {
    id: "extra-class",
    title: "Extra Class",
    shortTitle: "Extra Class",
    spreadsheetId: "1f5HNSsjR_08dDDVvFoqrG40SaKdxhgbRnhD8cp7gY_4",
    gid: "15540423",
    badge: "Extra Class",
    description: "Special & Extra Lecture Schedules for Pune Batches"
  },
  "test-announcement": {
    id: "test-announcement",
    title: "Test Announcement",
    shortTitle: "Test Announcement",
    spreadsheetId: "1vDmONGVnul5yt-zHMdVBXkzP-FllP1KHXahpEw484TQ",
    gid: "1002186338",
    badge: "Announcements",
    description: "Upcoming Test Schedules, Dates & Syllabus for Pune Center"
  },
  "city-test": {
    id: "city-test",
    title: "City Test",
    shortTitle: "City Test",
    spreadsheetId: "14JW6teDhy6p4ToEMf053VGYBdDC8sWO7JV54uM8m9Kg",
    gid: "844497176",
    badge: "City Test",
    description: "City-Level Mock Tests, Venues & Batch Allocations"
  },
  "batch-overlook": {
    id: "batch-overlook",
    title: "Batch Overlook",
    shortTitle: "Batch Overlook",
    spreadsheetId: "1Z5Bt6ObwLO3rleW-NYOMvYXMwhrl4Gy7Nk3b-DhRPfY",
    targetSheetTitle: "Batch level - Overlook Sheet 2 ( Vidyapeeth )",
    gid: "1684539633",
    badge: "Overlook",
    description: "Batch Performance, Tracking, and High-Level Status Overview"
  },
  "mip-batches": {
    id: "mip-batches",
    title: "MIP Batches",
    shortTitle: "MIP Batches",
    spreadsheetId: "1W6u_PJSFcs5KjzfW05FCI2aOU2Xc9j_EhyEwIczpXek",
    gid: "529627573",
    badge: "MIP",
    description: "Most Important Program (MIP) Batches, Mentors & Allocations"
  },
  "audit-sheet": {
    id: "audit-sheet",
    title: "Audit Sheet",
    shortTitle: "Audit Sheet",
    spreadsheetId: "1ZXz1LySgzYL06gNbM7N8jCbnTOyVGiHQ0I596F-Sq_k",
    gid: "1232755258",
    badge: "Audit",
    description: "Academic & Content Audit for Pune Batches"
  }
};
app.get("/api/custom-modules/data", async (req, res) => {
  try {
    const moduleId = req.query.moduleId || "extra-class";
    const config = CUSTOM_MODULE_MAP[moduleId];
    if (!config) {
      return res.status(400).json({ error: `Invalid moduleId: ${moduleId}` });
    }
    const forceRefresh = req.query.refresh === "true";
    const cacheKey = `${moduleId}-${config.spreadsheetId}-${config.gid}`;
    const cached = customModuleCache.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < 3 * 60 * 1e3) {
      return res.json(cached.data);
    }
    const auth = getGoogleAuth(req);
    const sheets = google.sheets({ version: "v4", auth });
    const metaRes = await sheets.spreadsheets.get({
      spreadsheetId: config.spreadsheetId
    });
    const sheetsList = metaRes.data.sheets || [];
    let matchedSheet = null;
    if (config.targetSheetTitle) {
      const targetTitleLower = config.targetSheetTitle.toLowerCase().trim();
      matchedSheet = sheetsList.find((s) => {
        const t = (s.properties?.title || "").toLowerCase().trim();
        return t === targetTitleLower || t.includes(targetTitleLower) || targetTitleLower.includes(t);
      });
    }
    if (!matchedSheet && config.gid) {
      const targetGidNum = Number(config.gid);
      matchedSheet = sheetsList.find((s) => s.properties?.sheetId === targetGidNum);
    }
    if (!matchedSheet) {
      matchedSheet = sheetsList[0];
    }
    const sheetTitle = matchedSheet?.properties?.title || "Sheet1";
    const spreadsheetTitle = metaRes.data.properties?.title || config.title;
    const valuesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `'${sheetTitle}'!A1:ZZ`
    });
    const rawRows = valuesRes.data.values || [];
    if (rawRows.length === 0) {
      return res.json({
        moduleId: config.id,
        title: config.title,
        spreadsheetId: config.spreadsheetId,
        gid: config.gid,
        sheetTitle,
        spreadsheetTitle,
        headers: [],
        rows: [],
        totalCount: 0
      });
    }
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const nonEmpty = rawRows[i].filter((c) => c !== void 0 && c !== null && String(c).trim() !== "");
      if (nonEmpty.length >= 2) {
        headerRowIndex = i;
        break;
      }
    }
    const rawHeaderRow = rawRows[headerRowIndex] || [];
    let lastHeaderCol = rawHeaderRow.length - 1;
    while (lastHeaderCol > 0 && !String(rawHeaderRow[lastHeaderCol] || "").trim()) {
      lastHeaderCol--;
    }
    const trimmedRawHeaders = rawHeaderRow.slice(0, Math.min(lastHeaderCol + 1, 50));
    const rawHeaders = trimmedRawHeaders.map((h, i) => {
      const val = String(h || "").trim();
      return val || `Col_${i + 1}`;
    });
    const seenHeaders = /* @__PURE__ */ new Set();
    const headers = rawHeaders.map((h) => {
      let uniqueH = h;
      let counter = 1;
      while (seenHeaders.has(uniqueH)) {
        uniqueH = `${h}_${counter++}`;
      }
      seenHeaders.add(uniqueH);
      return uniqueH;
    });
    const dataRows = [];
    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const rowArr = rawRows[r] || [];
      const isAllEmpty = rowArr.every((c) => c === void 0 || c === null || String(c).trim() === "");
      if (isAllEmpty) continue;
      const rowObj = {
        _rowIndex: String(r + 1)
      };
      headers.forEach((h, colIdx) => {
        rowObj[h] = String(rowArr[colIdx] ?? "").trim();
      });
      rowObj._rawText = Object.values(rowObj).slice(0, 10).join(" ");
      dataRows.push(rowObj);
    }
    const responsePayload = {
      moduleId: config.id,
      title: config.title,
      spreadsheetId: config.spreadsheetId,
      gid: config.gid,
      sheetTitle,
      spreadsheetTitle,
      headers,
      rows: dataRows,
      totalCount: dataRows.length
    };
    customModuleCache.set(cacheKey, {
      data: responsePayload,
      timestamp: Date.now()
    });
    res.json(responsePayload);
  } catch (err) {
    console.error("API Error (/api/custom-modules/data):", err);
    res.status(500).json({ error: err.message || "Failed to fetch custom module sheet data." });
  }
});
app.get("/api/extra-classes/schedule", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    let sheets = null;
    try {
      const auth = getGoogleAuth(req);
      sheets = google.sheets({ version: "v4", auth });
    } catch {
    }
    const payload = await fetchAllExtraClassLectures(sheets, forceRefresh);
    res.json(payload);
  } catch (err) {
    console.error("API Error (/api/extra-classes/schedule):", err);
    res.status(500).json({ error: err.message || "Failed to aggregate extra classes." });
  }
});
app.post("/api/extra-classes/mark-done", async (req, res) => {
  try {
    const { spreadsheetId, sheetTitle, rowIndex, statusColLetter, status } = req.body || {};
    if (!sheetTitle || !rowIndex) {
      return res.status(400).json({ error: "Missing sheetTitle or rowIndex" });
    }
    const auth = getGoogleAuth(req);
    const sheets = google.sheets({ version: "v4", auth });
    const targetSheetId = spreadsheetId || EXTRA_CLASS_SPREADSHEET_ID;
    const col = statusColLetter || "O";
    const range = `'${sheetTitle}'!${col}${rowIndex}`;
    const newStatus = status !== void 0 ? String(status) : "Done";
    await sheets.spreadsheets.values.update({
      spreadsheetId: targetSheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[newStatus]]
      }
    });
    const cacheKey = `extra-classes-${targetSheetId}`;
    const cached = extraClassCache.get(cacheKey);
    if (cached && cached.data && Array.isArray(cached.data.classes)) {
      const isDone = newStatus.toLowerCase().includes("done");
      for (const cls of cached.data.classes) {
        if (cls.sheetTitle === sheetTitle && Number(cls.rowIndex) === Number(rowIndex)) {
          cls.rawStatus = newStatus;
          cls.isDone = isDone;
          break;
        }
      }
      cached.data.counts = {
        ...cached.data.counts,
        done: cached.data.classes.filter((c) => c.isDone).length,
        pending: cached.data.classes.filter((c) => !c.isDone).length
      };
      cached.timestamp = Date.now();
    }
    res.json({
      success: true,
      updatedRange: range,
      sheetTitle,
      rowIndex,
      status: newStatus
    });
  } catch (err) {
    console.error("API Error (/api/extra-classes/mark-done):", err);
    res.status(500).json({ error: err.message || "Failed to mark extra class status in Google Sheets." });
  }
});
app.get("/api/audit-sheet", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const auth = getGoogleAuth(req);
    const sheets = google.sheets({ version: "v4", auth });
    const payload = await fetchAuditSheetWithCache(sheets, forceRefresh);
    res.json(payload);
  } catch (err) {
    console.error("API Error (/api/audit-sheet):", err);
    res.status(500).json({ error: err.message || "Failed to fetch audit sheet data." });
  }
});
app.post("/api/ai/explain", async (req, res) => {
  const { batchCode, tabName, category, phase, timeSlot, bmEmail, todayLectures, allLectures, auditIssues, extraClasses } = req.body || {};
  if (!batchCode) {
    return res.status(400).json({ error: "Batch Code is required" });
  }
  const { dateStr: todayDate, dayStr: todayDay } = getIstDateInfo();
  let scheduleContext = "";
  if (Array.isArray(todayLectures) && todayLectures.length > 0) {
    scheduleContext = `
### \u{1F4C5} TODAY'S LECTURES (${todayDay}, ${todayDate} from ${tabName || "Center"} 'Raw_DB'):
` + todayLectures.map(
      (l, i) => `- **Lecture ${i + 1} (${l.timeRange || `${l.startTime} - ${l.endTime}`})**: Subject: **${l.subject || "Subject TBD"}** | Faculty: **${l.facultyCode || "TBD"}** | Teacher Email: **${l.teacherEmail || "Not Listed"}**`
    ).join("\n");
  } else if (Array.isArray(allLectures) && allLectures.length > 0) {
    scheduleContext = `
### \u{1F4C5} WEEKLY TIMETABLE OVERVIEW (from ${tabName || "Center"} 'Raw_DB'):
No lectures scheduled for today (${todayDay}, ${todayDate}). Total lectures scheduled this week: ${allLectures.length}.
Upcoming scheduled classes:
` + allLectures.slice(0, 4).map(
      (l, i) => `- ${l.day} (${l.timeRange || `${l.startTime} - ${l.endTime}`}): Subject: **${l.subject || "General"}** | Faculty: **${l.facultyCode || "TBD"}** | Email: **${l.teacherEmail || "N/A"}**`
    ).join("\n");
  } else {
    scheduleContext = `
*(Note: No live timetable rows found for ${batchCode} in ${tabName || "Center"} 'Raw_DB' subsheet.)*`;
  }
  let auditContext = "";
  if (Array.isArray(auditIssues) && auditIssues.length > 0) {
    auditContext = `
### \u26A0\uFE0F AUDIT ISSUES & PENDENCY RECORDED (${auditIssues.length}):
` + auditIssues.map(
      (iss, i) => `- **Issue ${i + 1} [${iss.subsheet || "Audit"}]**: Date/Time: **${iss.lecStartTime || "Recent"}** | Subject: **${iss.subjectName || "N/A"}** | Issue: **${iss.errors}** | Assigned BM: **${iss.finalBm || "N/A"}**`
    ).join("\n");
  } else {
    auditContext = `
### \u2705 AUDIT STATUS: No audit errors or pendency recorded for this batch.`;
  }
  let extraClassContext = "";
  if (Array.isArray(extraClasses) && extraClasses.length > 0) {
    extraClassContext = `
### \u{1F4CC} RECENT EXTRA CLASSES (YESTERDAY / TODAY / TOMORROW) & ANNOUNCEMENT STATUS (${extraClasses.length}):
` + extraClasses.map(
      (ec, i) => `- **Extra Lecture ${i + 1} (${ec.dateTag || (ec.isToday ? "TODAY" : ec.isTomorrow ? "TOMORROW" : "YESTERDAY")} \u2022 ${ec.date} \u2022 ${ec.timeRange})**: Subject: **${ec.subject}** | Faculty: **${ec.teacherName}** | Room: **${ec.room}** | Announcement Status: **${ec.isDone ? "\u2713 ANNOUNCEMENT DONE (Column O)" : "\u26A0\uFE0F ANNOUNCEMENT PENDING (Column O)"}**`
    ).join("\n");
  } else {
    extraClassContext = `
### \u{1F4CC} EXTRA CLASSES: No extra classes scheduled for yesterday, today, or tomorrow for this batch.`;
  }
  const fallbackText = `### \u{1F4CB} Batch Details: **${batchCode}**
      
*   **Active Center / Tab:** ${tabName || "General Center"}
*   **Target Stream:** ${category || "General Studies"}
*   **Phase:** ${phase || "Standard Phase"}
*   **Timing Shift:** ${timeSlot || "Not specified"}
*   **Manager Assigned:** ${bmEmail || "No Manager Assigned"}

${scheduleContext}

${auditContext}

${extraClassContext}

#### \u{1F50D} Academic Breakdown:
- **Class / Level:** ${batchCode.includes("LJ") || batchCode.includes("LN") ? "Lakshya Series (Grade 12 / Board + Competitive Prep)" : batchCode.includes("AJ") || batchCode.includes("AN") ? "Arjuna Series (Grade 11 / Advanced Foundation)" : batchCode.includes("Y") ? "Yakeen Series (Dropper / Dedicated Repeater)" : "Specialized Program"}
- **Shifts & Timings:** ${timeSlot === "Morning" ? "Morning Shift (MA/MP)" : timeSlot === "Afternoon" ? "Afternoon Shift (NA/NP)" : timeSlot === "Evening" ? "Evening Shift (EA/EP)" : timeSlot === "Weekend" ? "Weekend Batch (WA)" : "Standard Schedule"}

#### \u{1F4C5} Timetable Summary:
- Live classes, subjects, extra lectures, and teacher emails are extracted directly from Raw_DB and Extra Class sheets above.`;
  const openRouterKey = (process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || "").trim();
  if (!openRouterKey) {
    return res.json({ explanation: fallbackText });
  }
  try {
    const prompt = `You are "Batch Finder Pro AI Copilot" - an expert assistant for Physics Wallah (PW) offline centers in India.
Your task is to decode this specific batch code: "${batchCode}".

CRITICAL LANGUAGE REQUIREMENT: All responses, briefings, action checklists, and WhatsApp messages MUST be strictly in 100% professional English. Never output Hindi, Hinglish, or Devanagari script under any circumstances, regardless of the language used by the user in their prompt.

Context details provided:
- Active Center / Tab: "${tabName || "Unknown"}"
- Stream Category: "${category || "Unknown"}"
- Phase Match: "${phase || "Unknown"}"
- Shift Timing: "${timeSlot || "Unknown"}"
- Assigned Batch Manager (BM): "${bmEmail || "None"}"
- Today's Date & Day: "${todayDay}, ${todayDate}"

LIVE TIMETABLE DATA FROM 'Raw_DB' (Column AI = Subject, Column AK = Teacher Email):
${scheduleContext}

${auditContext}

${extraClassContext}

Please provide a highly polished, professional, and actionable academic briefing in Markdown (STRICTLY IN ENGLISH ONLY):

1. **\u{1F4C5} Today's Live Academic Schedule & Subject Flow**:
   - Clearly detail today's classes: subject (from Column AI), lecture timing, faculty code, and teacher's email (from Column AK).
   - If no lectures are scheduled today, highlight when the next class is and summarize the weekly schedule.
2. **\u{1F4A1} Batch Academic Level & Phase**:
   - Identify grade/class (e.g., Arjuna = 11th, Lakshya = 12th, Yakeen = Droppers, Foundation = 9th/10th), target exam (JEE / NEET / Boards), and phase milestone.
3. **\u26A0\uFE0F Audit Issues & Extra Class Announcements Alert**:
   - Explicitly highlight any audit issues or pendency recorded above (with subsheet, date, and error). If clean, state that no audit issues are pending.
   - Mention any extra class scheduled and whether its announcement is DONE or PENDING.
4. **\u{1F4CB} Batch Manager Action Checklist for Today**:
   - Provide 2-3 specific, tactical steps for ${bmEmail || "the BM"} for today's classes (e.g. verifying attendance, confirming room prep with faculty, ensuring DPP distribution).
5. **\u{1F4AC} Student Daily Reminder Draft (WhatsApp format)**:
   - Provide a concise, ready-to-copy WhatsApp message for students mentioning today's lecture times and subjects in clear English.

Keep the output clean, encouraging, professional, strictly in English, and under 400 words.`;
    if (openRouterKey.startsWith("sk-or-v1-")) {
      const candidateModels = [
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "mistralai/mistral-7b-instruct:free"
      ];
      for (const candidateModel of candidateModels) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Authorization": `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://pune-batches.vercel.app",
              "X-Title": "Pune Batches Copilot"
            },
            body: JSON.stringify({
              model: candidateModel,
              messages: [{ role: "user", content: prompt }]
            })
          });
          clearTimeout(timeoutId);
          if (orRes.ok) {
            const data = await orRes.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) return res.json({ explanation: text });
          }
        } catch {
        }
      }
      return res.json({ explanation: fallbackText });
    }
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    res.json({ explanation: response.text || fallbackText });
  } catch (error) {
    console.warn("AI Copilot fallback applied:", error.message);
    res.json({ explanation: fallbackText });
  }
});
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history, contextBatch, todayLectures } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    let scheduleText = "";
    if (Array.isArray(todayLectures) && todayLectures.length > 0) {
      scheduleText = " Today's Scheduled Lectures (from Raw_DB): " + todayLectures.map((l) => `${l.timeRange || l.startTime}: Subject: ${l.subject || "General"} | Faculty: ${l.facultyCode} | Email: ${l.teacherEmail}`).join("; ");
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply: `I am currently running in Offline mode. Please configure your \`GEMINI_API_KEY\` in **Settings > Secrets** to enable full conversation reasoning and tactical batch planning!

${scheduleText ? `\u{1F4C5} **Live Schedule Context:**
${scheduleText}

` : ""}Here is a quick static tip: Keep your Google Drive folders organized by subject (Physics, Chemistry, Math/Biology) and create a separate folder for "DPP Solutions" to minimize student queries!`
      });
    }
    const openRouterKey = (process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || "").trim();
    if (openRouterKey.startsWith("sk-or-v1-")) {
      const systemPrompt = `You are "Batch Finder Pro AI Copilot", a brilliant academic coordinator and counselor for Physics Wallah (PW) centers. Help the Batch Manager with operational issues, student messaging, organizing Drive files, and answering center-related questions. You have live access to the center timetable from Raw_DB. Keep answers clear, tactical, and brief (under 200 words).
CRITICAL LANGUAGE POLICY: All responses, briefings, action checklists, recommendations, and messages MUST be strictly in 100% professional English. Under no circumstances should you output Hindi, Hinglish, or Devanagari script, even if the user prompts you in Hindi or Hinglish.${contextBatch ? `

Context: The user is currently viewing batch "${contextBatch.displayName}" (Category: ${contextBatch.category}, Phase: ${contextBatch.phase}, Shift: ${contextBatch.timeSlot}, Manager Assigned: ${contextBatch.bmEmail || "None"}).${scheduleText}` : ""}`;
      const openRouterMessages = [
        { role: "system", content: systemPrompt }
      ];
      if (Array.isArray(history)) {
        history.forEach((turn) => {
          if (turn.role && turn.text) {
            openRouterMessages.push({
              role: turn.role === "user" ? "user" : "assistant",
              content: turn.text
            });
          }
        });
      }
      openRouterMessages.push({
        role: "user",
        content: message
      });
      const candidateModels = [
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen-2.5-72b-instruct:free",
        "mistralai/mistral-7b-instruct:free"
      ];
      let openRouterReply = "";
      for (const candidateModel of candidateModels) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Authorization": `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://pune-batches.vercel.app",
              "X-Title": "Pune Batches Copilot"
            },
            body: JSON.stringify({
              model: candidateModel,
              messages: openRouterMessages
            })
          });
          clearTimeout(timeoutId);
          if (orRes.ok) {
            const data = await orRes.json();
            openRouterReply = data.choices?.[0]?.message?.content || "";
            if (openRouterReply) break;
          }
        } catch (mErr) {
          console.warn(`OpenRouter model ${candidateModel} failed:`, mErr);
        }
      }
      if (openRouterReply) {
        return res.json({ reply: openRouterReply });
      } else {
        return res.json({
          reply: `(Offline AI Copilot) Here is a quick academic tip for **${contextBatch?.displayName || "this batch"}**:

${scheduleText ? `\u{1F4C5} **Schedule Context:** ${scheduleText}

` : ""}Ensure all lecture study materials, handouts, and DPP keys are uploaded to the corresponding subject drive folder to keep students aligned.`
        });
      }
    }
    const formattedContents = [];
    formattedContents.push({
      role: "user",
      parts: [{ text: `System Command: You are "Batch Finder Pro AI Copilot", a brilliant academic coordinator and counselor for Physics Wallah (PW) centers. Help the Batch Manager with operational issues, student messaging, organizing Drive files, and answering center-related questions. You have live access to the center timetable from Raw_DB. Keep answers clear, tactical, and brief (under 200 words). CRITICAL LANGUAGE POLICY: All responses, briefings, action checklists, recommendations, and messages MUST be strictly in 100% professional English. Never output Hindi, Hinglish, or Devanagari script under any circumstances, even if asked in Hindi or Hinglish.` }]
    });
    formattedContents.push({
      role: "model",
      parts: [{ text: "Understood. I will strictly provide all answers, briefings, and communications exclusively in 100% professional English." }]
    });
    if (contextBatch) {
      formattedContents.push({
        role: "user",
        parts: [{ text: `Context: The user is currently viewing batch "${contextBatch.displayName}" (Category: ${contextBatch.category}, Phase: ${contextBatch.phase}, Shift: ${contextBatch.timeSlot}, Manager Assigned: ${contextBatch.bmEmail || "None"}).${scheduleText}` }]
      });
      formattedContents.push({
        role: "model",
        parts: [{ text: `Acknowledged. I have cached the details and timetable for ${contextBatch.displayName} and will answer with this batch and schedule context in mind.` }]
      });
    }
    if (Array.isArray(history)) {
      history.forEach((turn) => {
        if (turn.role && turn.text) {
          formattedContents.push({
            role: turn.role === "user" ? "user" : "model",
            parts: [{ text: turn.text }]
          });
        }
      });
    }
    formattedContents.push({
      role: "user",
      parts: [{ text: message }]
    });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedContents
    });
    res.json({ reply: response.text || "I am here to help, but couldn't generate a reply. Please try again." });
  } catch (error) {
    console.warn("AI Chat fallback applied:", error.message);
    res.json({
      reply: `I am currently operating in offline mode. Please verify the batch timetable schedule above, and feel free to copy lecture details or draft messages!`
    });
  }
});
async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vitePkg = "vite";
    const { createServer: createViteServer } = await import(vitePkg);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  if (!process.env.VERCEL) {
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE" && !process.env.PORT) {
        const fallbackPort = PORT + 1;
        console.warn(`Port ${PORT} is in use, falling back to port ${fallbackPort}...`);
        app.listen(fallbackPort, "0.0.0.0", () => {
          console.log(`Server running on port ${fallbackPort}`);
        });
      } else {
        console.error("Server error:", err);
      }
    });
  }
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
export {
  app,
  server_default as default
};
