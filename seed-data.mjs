import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config();

const sampleHotels = [
  {
    name: '东京帝国酒店',
    nameEn: 'Imperial Hotel Tokyo',
    city: 'Tokyo',
    country: 'Japan',
    address: '1-1-1 Uchisaiwaicho, Chiyoda-ku, Tokyo',
    latitude: 35.6722,
    longitude: 139.7577
