import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBody,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y obtener un token JWT' })
  @ApiBody({ type: LoginDto })
  @ApiCreatedResponse({ description: 'Token emitido y datos del usuario autenticado' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas o cuenta no habilitada' })
  @ApiResponse({ status: 409, description: 'La cuenta está bloqueada' })
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.authService.login(dto, {
      ip: request.ip,
      userAgent: request.get('user-agent'),
    });
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Obtener el usuario autenticado actual' })
  @ApiOkResponse({ description: 'Información del usuario autenticado' })
  me(@CurrentUser() user: unknown) {
    return user;
  }
}
