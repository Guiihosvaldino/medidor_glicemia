from django.contrib import admin
from .models import PerfilUsuario, PerfilMedico

# Personalização do cabeçalho do painel
admin.site.site_header = "Painel Administrativo - Medidor de Glicemia"
admin.site.site_title = "Medidor de Glicemia Admin"
admin.site.index_title = "Gerenciamento de Usuários e Acessos"

@admin.register(PerfilUsuario)
class PacienteAdmin(admin.ModelAdmin):
    # Lista exibida para os Pacientes
    list_display = ('get_username', 'get_full_name', 'get_email', 'get_last_login', 'get_date_joined')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__email', 'cpf')

    @admin.display(description='Usuário / E-mail')
    def get_username(self, obj):
        return obj.user.username

    @admin.display(description='Nome Completo')
    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    @admin.display(description='E-mail de Contato')
    def get_email(self, obj):
        return obj.user.email

    @admin.display(description='Último Acesso')
    def get_last_login(self, obj):
        if obj.user.last_login:
            return obj.user.last_login.strftime('%d/%m/%Y %H:%M')
        return "Nunca acessou"

    @admin.display(description='Data do Cadastro')
    def get_date_joined(self, obj):
        return obj.user.date_joined.strftime('%d/%m/%Y')


@admin.register(PerfilMedico)
class MedicoAdmin(admin.ModelAdmin):
    # Lista exibida para os Médicos (separado dos Pacientes)
    list_display = ('get_username', 'get_full_name', 'crm', 'uf', 'get_email', 'get_last_login')
    search_fields = ('crm', 'user__username', 'user__first_name', 'user__last_name', 'user__email')

    @admin.display(description='Usuário / E-mail')
    def get_username(self, obj):
        return obj.user.username

    @admin.display(description='Nome Completo')
    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    @admin.display(description='E-mail de Contato')
    def get_email(self, obj):
        return obj.user.email

    @admin.display(description='Último Acesso')
    def get_last_login(self, obj):
        if obj.user.last_login:
            return obj.user.last_login.strftime('%d/%m/%Y %H:%M')
        return "Nunca acessou"