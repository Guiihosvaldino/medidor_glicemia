from datetime import date

from django.contrib.auth.models import User
from django.test import RequestFactory, TestCase
from rest_framework.authtoken.models import Token

from .api_views import api_dashboard_medico, api_perfil_paciente, api_perfil_medico
from .models import AutorizacaoAcesso, PerfilMedico, PerfilUsuario


class ApiDashboardMedicoTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

        self.medico_user = User.objects.create_user(
            username='medico@example.com',
            email='medico@example.com',
            password='123456',
            first_name='Dr. Ana'
        )
        PerfilMedico.objects.create(user=self.medico_user, crm='123456', uf='MG')

        self.paciente_user = User.objects.create_user(
            username='paciente@example.com',
            email='paciente@example.com',
            password='123456',
            first_name='Maria'
        )
        PerfilUsuario.objects.create(
            user=self.paciente_user,
            cpf='01961546698',
            data_nascimento=date(1990, 1, 1)
        )

    def test_dashboard_medico_busca_paciente_por_cpf(self):
        AutorizacaoAcesso.objects.create(
            medico=self.medico_user,
            paciente=self.paciente_user,
            status='aprovado'
        )

        token, _ = Token.objects.get_or_create(user=self.medico_user)
        request = self.factory.get('/api/dashboard-medico/', {'cpf': '01961546698'})
        request.user = self.medico_user
        request.META['HTTP_AUTHORIZATION'] = f'Token {token.key}'

        response = api_dashboard_medico(request)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['sucesso'])
        self.assertEqual(response.data['paciente']['cpf'], '01961546698')

    def test_dashboard_medico_pede_aprovacao_quando_nao_autorizado(self):
        token, _ = Token.objects.get_or_create(user=self.medico_user)
        request = self.factory.get('/api/dashboard-medico/', {'cpf': '01961546698'})
        request.user = self.medico_user
        request.META['HTTP_AUTHORIZATION'] = f'Token {token.key}'

        response = api_dashboard_medico(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'pendente')
        self.assertTrue(
            AutorizacaoAcesso.objects.filter(
                medico=self.medico_user,
                paciente=self.paciente_user,
                status='pendente'
            ).exists()
        )

    def test_perfil_paciente_altera_senha_quando_confirmada(self):
        token, _ = Token.objects.get_or_create(user=self.paciente_user)
        request = self.factory.post('/api/perfil-paciente/', {
            'nome': 'Maria',
            'email': 'paciente@example.com',
            'cpf': '01961546698',
            'data_nascimento': '1990-01-01',
            'senha': 'novaSenha123',
            'confirmar_senha': 'novaSenha123',
        })
        request.META['HTTP_AUTHORIZATION'] = f'Token {token.key}'

        response = api_perfil_paciente(request)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['sucesso'])
        self.paciente_user.refresh_from_db()
        self.assertTrue(self.paciente_user.check_password('novaSenha123'))

    def test_perfil_medico_altera_senha_quando_confirmada(self):
        token, _ = Token.objects.get_or_create(user=self.medico_user)
        request = self.factory.post('/api/perfil-medico/', {
            'nome': 'Dr. Ana',
            'email': 'medico@example.com',
            'cpf': '12345678909',
            'telefone': '31999999999',
            'tipo_registro': 'CRM',
            'registro_num': '12345',
            'uf': 'MG',
            'senha': 'novaSenha456',
            'confirmar_senha': 'novaSenha456',
        })
        request.META['HTTP_AUTHORIZATION'] = f'Token {token.key}'

        response = api_perfil_medico(request)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['sucesso'])
        self.medico_user.refresh_from_db()
        self.assertTrue(self.medico_user.check_password('novaSenha456'))

    def test_perfil_medico_get_nao_quebra_sem_campos_opcionais(self):
        token, _ = Token.objects.get_or_create(user=self.medico_user)
        request = self.factory.get('/api/perfil-medico/')
        request.user = self.medico_user
        request.META['HTTP_AUTHORIZATION'] = f'Token {token.key}'

        response = api_perfil_medico(request)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['sucesso'])
        self.assertEqual(response.data['telefone'], '')
        self.assertEqual(response.data['tipo_registro'], '')
        self.assertEqual(response.data['registro_num'], '')
