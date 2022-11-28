import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { redisStore } from 'cache-manager-redis-store';
import { PodcastsModule } from './podcasts/podcasts.module';
import { CaslModule } from './casl/casl.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
      autoSchemaFile: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      useFactory: async (config: ConfigService) => {
        const store = await redisStore({
          socket: {
            host: config.get('REDIS_HOST'),
            port: +config.get('REDIS_PORT'),
          },
          ttl: 7 * 24 * 60 * 60,
        });
        return {
          store: () => store,
        };
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PodcastsModule,
    CaslModule,
  ],
})
export class AppModule {}
