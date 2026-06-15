from django.db import models
from django.contrib.auth.models import User

# Extensão do usuário padrão do Django para adicionar CPF e Data de Nascimento
class PerfilUsuario(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    cpf = models.CharField(max_length=11, unique=True)
    data_nascimento = models.DateField()

    def __str__(self):
        return self.user.username

# Tabela de Medições
class Medicao(models.Model):
    TIPOS_MEDICAO = [
        ('Jejum', 'Jejum'),
        ('Pre-Prandial', 'Pré-Prandial'),
        ('Pos-Prandial', 'Pós-Prandial'),
        ('Antes-Dormir', 'Antes de Dormir'),
        ('Outro', 'Outro'),
    ]

    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='medicoes')
    valor = models.IntegerField() # mg/dL
    data = models.DateField()
    hora = models.TimeField()
    tipo = models.CharField(max_length=20, choices=TIPOS_MEDICAO)
    notas = models.TextField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.usuario.username} - {self.valor} mg/dL ({self.data})"