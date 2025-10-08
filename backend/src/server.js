const fastify = require('fastify');
const config = require('./config');
const dbConfig = require('./config/database');

// Créer l'instance Fastify
const app = fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'info' : 'error',
    transport: config.nodeEnv === 'development' ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
});

// Fonction pour démarrer le serveur
async function start() {
  try {
    // Enregistrer les plugins
    await app.register(require('@fastify/cors'), {
      origin: config.corsOrigin,
      credentials: true,
    });

    await app.register(require('@fastify/jwt'), {
      secret: config.jwtSecret,
    });

    await app.register(require('@fastify/postgres'), {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
    });

    await app.register(require('@fastify/websocket'));

    // Enregistrer le plugin d'authentification
    await app.register(require('./plugins/authenticate'));

    // Enregistrer les routes
    await app.register(require('./routes/health'));
    await app.register(require('./routes/auth'), { prefix: '/api/auth' });
    await app.register(require('./routes/users'), { prefix: '/api/users' });
    await app.register(require('./routes/matches'), { prefix: '/api/matches' });

    // Route racine
    app.get('/', async (request, reply) => {
      return {
        message: 'ft_transcendence API',
        version: '1.0.0',
        status: 'running',
      };
    });

    // Gestion globale des erreurs
    app.setErrorHandler((error, request, reply) => {
      app.log.error(error);
      reply.status(error.statusCode || 500).send({
        error: error.message || 'Internal Server Error',
        statusCode: error.statusCode || 500,
      });
    });

    // Démarrer le serveur
    await app.listen({
      port: config.port,
      host: config.host,
    });

    console.log(`🚀 Serveur démarré sur http://${config.host}:${config.port}`);
    console.log(`📊 Environnement: ${config.nodeEnv}`);

  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

// Gestion de l'arrêt gracieux
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach(signal => {
  process.on(signal, async () => {
    console.log(`\n${signal} reçu, arrêt du serveur...`);
    await app.close();
    process.exit(0);
  });
});

start();
