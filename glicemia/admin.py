from django.contrib import admin
from .models import PerfilUsuario, PerfilMedico, AutorizacaoAcesso, Medicao, Medicamento, TaxaCorrecao

@admin.register(PerfilUsuario)
class PacienteAdmin(admin.ModelAdmin):
    # Exibe o último acesso na tabela de pacientes
    list_display = ('get_username', 'get_full_name', 'get_email', 'get_last_login', 'get_date_joined')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__email', 'cpf')

    @admin.display(description='Usuário')
    def get_username(self, obj):
        return obj.user.username

    @admin.display(description='Nome Completo')
    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    @admin.display(description='E-mail')
    def get_email(self, obj):
        return obj.user.email

    @admin.display(description='Último Acesso')
    def get_last_login(self, obj):
        if obj.user.last_login:
            return obj.user.last_login.strftime('%d/%m/%Y %H:%M')
        return "Nunca acessou"

    @admin.display(description='Cadastrado em')
    def get_date_joined(self, obj):
        return obj.user.date_joined.strftime('%d/%m/%Y')


@admin.register(PerfilMedico)
class MedicoAdmin(admin.ModelAdmin):
    # Exibe o último acesso na tabela de médicos
    list_display = ('crm', 'uf', 'get_username', 'get_full_name', 'get_email', 'get_last_login')
    search_fields = ('crm', 'user__username', 'user__first_name', 'user__last_name', 'user__email')

    @admin.display(description='Usuário')
    def get_username(self, obj):
        return obj.user.username

    @admin.display(description='Nome Completo')
    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    @admin.display(description='E-mail')
    def get_email(self, obj):
        return obj.user.email

    @admin.display(description='Último Acesso')
    def get_last_login(self, obj):
        if obj.user.last_login:
            return obj.user.last_login.strftime('%d/%m/%Y %H:%M')
        return "Nunca acessou"


@admin.register(AutorizacaoAcesso)
class AutorizacaoAcessoAdmin(admin.ModelAdmin):
    list_display = ('medico', 'paciente', 'status', 'criado_em')
    list_filter = ('status',)


@admin.register(Medicao)
class MedicaoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'valor', 'tipo', 'data', 'hora')
    list_filter = ('tipo', 'data')


admin.site.register(Medicamento)
admin.site.register(TaxaCorrecao)