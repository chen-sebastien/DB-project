import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reservationRoutes from './routes/reservationRoutes';
import authRoutes from './routes/authRoutes';
import settingsRoutes from './routes/settingsRoutes';
import resourceRoutes from './routes/resourceRoutes';
import ownerRoutes from './routes/ownerRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 註冊路由
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/owners', ownerRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

