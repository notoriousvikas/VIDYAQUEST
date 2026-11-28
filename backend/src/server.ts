import { createApp } from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';
import { seedSubjectWorlds } from './modules/gamification/services/seedWorld.service';
import { seedLeaderboardDemoStudents } from './modules/gamification/services/seedLeaderboardDemo.service';
import { ensureStudentDefaultsSeeded } from './modules/users/services/seedStudentDefaults.service';

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    await Promise.all([seedSubjectWorlds(), ensureStudentDefaultsSeeded()]);
    await seedLeaderboardDemoStudents();
    const app = createApp();
    app.listen(env.PORT, () => {
      console.log(`VIDYAQUEST backend listening on port ${env.PORT} (${env.NODE_ENV})`);
    });
  } catch (error) {
    console.error('Failed to start VIDYAQUEST backend:', error);
    process.exit(1);
  }
}

void startServer();
