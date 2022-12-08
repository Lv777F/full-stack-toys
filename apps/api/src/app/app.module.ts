import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

import { RedisModule } from '@liaoliaots/nestjs-redis';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { CaslModule } from './casl/casl.module';
import { PodcastsModule } from './podcasts/podcasts.module';

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
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        config: {
          url: config.get('REDIS_URL'),
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PodcastsModule,
    CaslModule,
  ],
})
export class AppModule {}
