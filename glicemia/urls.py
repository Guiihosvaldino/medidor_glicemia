from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('cadastro/', views.cadastro_view, name='cadastro'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('nova-medicao/', views.nova_medicao_view, name='nova_medicao'),
    path('logout/', views.logout_view, name='logout'),
    path('exportar-pdf/', views.exportar_pdf_view, name='exportar_pdf'),
    path('apagar-medicao/<int:id>/', views.apagar_medicao_view, name='apagar_medicao'),
    
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
]