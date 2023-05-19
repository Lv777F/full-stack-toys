import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { AuthModule } from './auth/auth.module';
import { CaslModule } from './casl/casl.module';
import { PodcastsModule } from './podcasts/podcasts.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: false,
      plugins: [
        ApolloServerPluginLandingPageLocalDefault({ embed: true }),
        ApolloServerPluginInlineTrace(),
      ],
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
