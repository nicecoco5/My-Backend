import cron from 'node-cron';
import { cleanupUnverifiedAccounts } from '../services/auth.service';

/**
 * Run cleanup job daily at 3 AM
 * Deletes unverified accounts older than 3 days
 */
export const startCleanupJob = () => {
    // Run every day at 3:00 AM
    cron.schedule('0 3 * * *', async () => {
        console.log('🧹 Running ghost account cleanup job...');
        try {
            await cleanupUnverifiedAccounts();
        } catch (error) {
            console.error('❌ Cleanup job failed:', error);
        }
    });

    console.log('✅ Ghost account cleanup job scheduled (daily at 3:00 AM)');
};
