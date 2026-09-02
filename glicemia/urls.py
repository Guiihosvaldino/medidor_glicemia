from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('cadastro/', views.cadastro_view, name='cadastro'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('perfil/', views.perfil_view, name='perfil'),
    path('excluir-conta/', views.excluir_conta_view, name='excluir_conta'),
    path('perfil-medico/', views.perfil_medico_view, name='perfil_medico'),
    path('nova-medicao/', views.nova_medicao_view, name='nova_medicao'),
    path('logout/', views.logout_view, name='logout'),
    path('exportar-pdf/', views.exportar_pdf_view, name='exportar_pdf'),
    path('apagar-medicao/<int:id>/', views.apagar_medicao_view, name='apagar_medicao'),
    path('editar-medicao/<int:id>/', views.editar_medicao_view, name='editar_medicao'),
    path('medicacoes/', views.medicacoes_view, name='medicacoes'),
    path('apagar-medicacao/<int:id>/', views.apagar_medicacao_view, name='apagar_medicacao'),
    path('apagar-taxa/<int:id>/', views.apagar_taxa_view, name='apagar_taxa'),
    path('medicacoes-medico/<str:cpf>/', views.medicacoes_medico_view, name='medicacoes_medico'),
    path('apagar-medicacao-medico/<int:id>/<str:cpf>/', views.apagar_medicacao_medico_view, name='apagar_medicacao_medico'),
    path('apagar-taxa-medico/<int:id>/<str:cpf>/', views.apagar_taxa_medico_view, name='apagar_taxa_medico'),
    path('api/validar-registro/', views.validar_registro_profissional, name='validar_registro'),
    
    # Recuperação de Senha
    path('recuperar-senha/', 
         auth_views.PasswordResetView.as_view(
             template_name='glicemia/password_reset_form.html',
             email_template_name='glicemia/password_reset_email.html',
             subject_template_name='glicemia/password_reset_subject.txt',
             success_url='/recuperar-senha/enviado/'
         ), 
         name='password_reset'),
         
    path('recuperar-senha/enviado/', 
         auth_views.PasswordResetDoneView.as_view(
             template_name='glicemia/password_reset_done.html'
         ), 
         name='password_reset_done'),
         
    path('recuperar-senha/<uidb64>/<token>/', 
         auth_views.PasswordResetConfirmView.as_view(
             template_name='glicemia/password_reset_confirm.html',
             success_url='/recuperar-senha/completo/'
         ), 
         name='password_reset_confirm'),
         
    path('recuperar-senha/completo/', 
         auth_views.PasswordResetCompleteView.as_view(
             template_name='glicemia/password_reset_complete.html'
         ), 
         name='password_reset_complete'),

    # Recuperação de Senha - Médico
    path('recuperar-senha-medico/', 
         auth_views.PasswordResetView.as_view(
             template_name='glicemia/password_reset_medico_form.html',
             email_template_name='glicemia/password_reset_medico_email.html',
             subject_template_name='glicemia/password_reset_subject.txt',
             success_url='/recuperar-senha-medico/enviado/'
         ), 
         name='password_reset_medico'),
         
    path('recuperar-senha-medico/enviado/', 
         auth_views.PasswordResetDoneView.as_view(
             template_name='glicemia/password_reset_medico_done.html'
         ), 
         name='password_reset_medico_done'),
         
    path('recuperar-senha-medico/<uidb64>/<token>/', 
         auth_views.PasswordResetConfirmView.as_view(
             template_name='glicemia/password_reset_medico_confirm.html',
             success_url='/recuperar-senha-medico/completo/'
         ), 
         name='password_reset_medico_confirm'),
         
    path('recuperar-senha-medico/completo/', 
         auth_views.PasswordResetCompleteView.as_view(
             template_name='glicemia/password_reset_medico_complete.html'
         ), 
         name='password_reset_medico_complete'),



    path('login-medico/', views.login_medico_view, name='login_medico'),
    
    # 2. Garanta que a rota de cadastro do médico está assim:
    path('cadastro-medico/', views.cadastro_medico_view, name='cadastro_medico'),
    path('dashboard-medico/', views.dashboard_medico_view, name='dashboard_medico'),
    path('logout-medico/',views.logout_medico_view, name='logout_medico'),
    path('solicitacoes/', views.solicitacoes_paciente_view, name='solicitacoes'),
    path('pacientes-autorizados/', views.pacientes_autorizados_view, name='pacientes_autorizados'),
    path('pesquisa-mes/', views.pesquisa_mes_view, name='pesquisa_mes'),
]