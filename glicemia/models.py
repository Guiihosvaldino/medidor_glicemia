from django.db import models
from django.contrib.auth.models import User
from datetime import datetime

# Placeholder function for future CRM validation (commented out)
# def validate_crm_online(crm_number):
#     """Chama um serviço externo para validar o número do CRM.
#     Esta função está comentada até que a aplicação esteja online.
#     """
#     # Exemplo de chamada usando requests (necessita internet e API real)
#     # response = requests.get(f'https://api.crmvalida.com/validate/{crm_number}')
#     # return response.json().get('valid', False)
#     pass

# Extensão do usuário padrão do Django para adicionar CPF e Data de Nascimento
class PerfilUsuario(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    cpf = models.CharField(max_length=11, unique=True) # Busca será feita por este campo
    data_nascimento = models.DateField()

    def __str__(self):
        return self.user.username


class PerfilMedico(models.Model):
    """Perfil exclusivo para usuários médicos.
    Campo opcional para validação de CRM que será feita via API externa.
    Por enquanto, a validação está comentada, pois depende de conexão online.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil_medico')
    crm = models.CharField(max_length=20, unique=True)
    uf = models.CharField(max_length=2, default='MG') # Adicionado UF para a futura validação
    
    # [MONETIZAÇÃO FUTURA] Descomente quando for cobrar pelo sistema
    # is_premium = models.BooleanField(default=False)

    # def validate_crm(self):
    #     """Validação do CRM via serviço externo.
    #     Descomente e implemente a chamada quando o serviço estiver disponível."""
    #     pass

    def __str__(self):
        return f"{self.user.username} (CRM: {self.crm}-{self.uf})"


# Tabela de Medições
class Medicao(models.Model):
    TIPOS_MEDICAO = [
        ('Jejum', 'Jejum'),
        ('Pre-Prandial', 'Antes da refeição'),
        ('Pos-Prandial', 'Após a refeição'),
        ('Antes-Dormir', 'Antes de Dormir'),
        ('Outro', 'Outro'),
    ]

    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='medicoes')
    valor = models.IntegerField() # mg/dL
    data = models.DateField()
    hora = models.TimeField()
    tipo = models.CharField(max_length=20, choices=TIPOS_MEDICAO)
    notes = models.TextField(blank=True, null=True) # Notas/Observações
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.usuario.username} - {self.valor} mg/dL ({self.data})"


# Tabela de Medicamentos (Insulinas, etc.)
class Medicamento(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='medicamentos')
    nome = models.CharField(max_length=100)
    dose_ui = models.IntegerField(blank=True, null=True) # Dose em UI (Principal para insulina)
    observacao = models.CharField(max_length=255)
    criado_em = models.DateTimeField(auto_now_add=True)
    
    # Campo novo: Registra se um médico editou/cadastrou para o paciente
    medico_editor = models.ForeignKey(PerfilMedico, on_delete=models.SET_NULL, null=True, blank=True, related_name='medicamentos_editados')

    def __str__(self):
        dose_texto = f"{self.dose_ui} UI" if self.dose_ui else ""
        return f"{self.nome} {dose_texto} - {self.observacao}"


# Tabela de Correção (Dose conforme faixa de glicemia)
class TaxaCorrecao(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='taxas_correcao')
    glicemia_min = models.IntegerField() # Ex: 150
    glicemia_max = models.IntegerField(blank=True, null=True) # Ex: 190. Se nulo, significa "maior que" o min
    dose_ui = models.IntegerField() # Ex: 1 UI
    criado_em = models.DateTimeField(auto_now_add=True)
    
    # Campo novo: Registra se um médico alterou essa taxa para o paciente
    medico_editor = models.ForeignKey(PerfilMedico, on_delete=models.SET_NULL, null=True, blank=True, related_name='taxas_editadas')

    def __str__(self):
        if self.glicemia_max:
            return f"{self.usuario.username}: {self.glicemia_min} a {self.glicemia_max} -> {self.dose_ui} UI"
        return f"{self.usuario.username}: > {self.glicemia_min} -> {self.dose_ui} UI"