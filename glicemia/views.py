from datetime import datetime
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.db.models import Avg, Count
from django.contrib import messages
from django.http import HttpResponse

# Imports do ReportLab para a geração do PDF
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from .models import PerfilUsuario, Medicao

# --- VIEW: CADASTRO ---
def cadastro_view(request):
    if request.method == 'POST':
        nome = request.POST.get('nome')
        email = request.POST.get('email')
        cpf = ''.join(filter(str.isdigit, request.POST.get('cpf')))
        data_nasc = request.POST.get('data_nascimento')
        senha = request.POST.get('senha')

        if User.objects.filter(username=email).exists():
            messages.error(request, 'Este e-mail já está cadastrado.')
            return redirect('cadastro')

        # Cria o usuário padrão do Django
        user = User.objects.create_user(username=email, email=email, password=senha, first_name=nome)
        # Cria o perfil acoplado com CPF e Data de Nascimento
        PerfilUsuario.objects.create(user=user, cpf=cpf, data_nascimento=data_nasc)
        
        messages.success(request, 'Cadastro realizado com sucesso! Faça seu login.')
        return redirect('login')

    return render(request, 'glicemia/cadastro.html')

# --- VIEW: LOGIN ---
def login_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        senha = request.POST.get('senha')

        user = authenticate(request, username=email, password=senha)
        if user is not None:
            auth_login(request, user)
            return redirect('dashboard')
        else:
            messages.error(request, 'E-mail ou senha incorretos.')
            
    return render(request, 'glicemia/login.html')

# --- VIEW: DASHBOARD & FILTROS (PROTEGIDA) ---
@login_required(login_url='login')
def dashboard_view(request):
    hoje = datetime.now()
    
    # Pega o mês e ano do filtro (POST) ou usa o atual (GET)
    mes_selecionado = int(request.POST.get('mes', request.GET.get('mes', hoje.month)))
    ano_selecionado = int(request.POST.get('ano', request.GET.get('ano', hoje.year)))

    # Filtra as medições do usuário logado no mês/ano escolhido
    medicoes = Medicao.objects.filter(
        usuario=request.user,
        data__month=mes_selecionado,
        data__year=ano_selecionado
    ).order_by('-data', '-hora')

    # Calcula a quantidade e a média de glicose usando o ORM do Django
    metricas = medicoes.aggregate(total=Count('id'), media=Avg('valor'))
    
    total_medicoes = metricas['total'] or 0
    media_glicose = round(metricas['media'], 2) if metricas['media'] else 0
    
    # Cálculo da Hemoglobina Glicada Estimada (Fórmula ADA)
    glicada_estimada = round((media_glicose + 46.7) / 28.7, 2) if media_glicose > 0 else 0

    contexto = {
        'medicoes': medicoes,
        'total_medicoes': total_medicoes,
        'media_glicose': media_glicose,
        'glicada_estimada': glicada_estimada,
        'mes_selecionado': mes_selecionado,
        'ano_selecionado': ano_selecionado,
    }
    return render(request, 'glicemia/dashboard.html', contexto)

# --- VIEW: NOVA MEDIÇÃO ---
@login_required(login_url='login')
def nova_medicao_view(request):
    if request.method == 'POST':
        valor = request.POST.get('valor')
        data = request.POST.get('data')
        hora = request.POST.get('hora')
        tipo = request.POST.get('tipo_medicao')
        notas = request.POST.get('notas', '')

        Medicao.objects.create(
            usuario=request.user,
            valor=valor,
            data=data,
            hora=hora,
            tipo=tipo,
            notas=notas
        )
        messages.success(request, 'Medição registrada!')
    return redirect('dashboard')

# --- VIEW: LOGOUT ---
def logout_view(request):
    auth_logout(request)
    return redirect('login')

# --- VIEW: EXPORTAR PDF ---
@login_required(login_url='login')
def exportar_pdf_view(request):
    # 1. Captura o mês e ano passados via URL (GET)
    hoje = datetime.now()
    mes = int(request.GET.get('mes', hoje.month))
    ano = int(request.GET.get('ano', hoje.year))

    # 2. Busca as medições filtradas do usuário
    medicoes = Medicao.objects.filter(
        usuario=request.user,
        data__month=mes,
        data__year=ano
    ).order_by('data', 'hora')

    # Calcula a média do período para colocar no topo do relatório do médico
    metricas = medicoes.aggregate(media=Avg('valor'))
    media_glicose = round(metricas['media'], 2) if metricas['media'] else 0
    glicada_estimada = round((media_glicose + 46.7) / 28.7, 2) if media_glicose > 0 else 0

    # 3. Configura o arquivo de resposta HTTP do tipo PDF
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="relatorio_glicemia_{mes}_{ano}.pdf"'

    # 4. Cria o documento PDF usando ReportLab
    doc = SimpleDocTemplate(response, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elementos = []
    
    # Estilos de texto
    estilos = getSampleStyleSheet()
    titulo_estilo = ParagraphStyle('Titulo', parent=estilos['Heading1'], fontSize=20, leading=24, textColor=colors.HexColor('#1A365D'), spaceAfter=12)
    subtitulo_estilo = ParagraphStyle('Subtitulo', parent=estilos['Normal'], fontSize=11, leading=14, spaceAfter=6)
    
    # Cabeçalho do Relatório
    elementos.append(Paragraph("Relatório de Acompanhamento Glicêmico", titulo_estilo))
    elementos.append(Paragraph(f"<b>Paciente:</b> {request.user.first_name}", subtitulo_estilo))
    elementos.append(Paragraph(f"<b>Período:</b> {mes:02d}/{ano}", subtitulo_estilo))
    elementos.append(Paragraph(f"<b>Média Glicêmica do Mês:</b> {media_glicose} mg/dL | <b>Glicada Estimada (A1C):</b> {glicada_estimada}%", subtitulo_estilo))
    elementos.append(Spacer(1, 15))

    # 5. Monta a Tabela de Dados para o Médico
    dados_tabela = [['Data', 'Hora', 'Valor (mg/dL)', 'Tipo de Medição', 'Observações']]
    
    for med in medicoes:
        data_formatada = med.data.strftime('%d/%m/%Y')
        hora_formatada = med.hora.strftime('%H:%M')
        # Adiciona a linha na tabela
        dados_tabela.append([
            data_formatada,
            hora_formatada,
            f"{med.valor} mg/dL",
            med.get_tipo_display(),
            med.notas or "-"
        ])

    # Se não houver registros
    if len(dados_tabela) == 1:
        dados_tabela.append(['Nenhum registro encontrado para este mês.', '', '', '', ''])

    # Configura e estiliza a tabela do PDF
    tabela_pdf = Table(dados_tabela, colWidths=[80, 60, 90, 110, 180])
    tabela_pdf.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1A365D')), # Azul escuro no topo
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F7FAFC')), # Fundo cinza claro nas linhas
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')), # Bordas suaves
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
    ]))

    elementos.append(tabela_pdf)
    
    # Constrói o PDF de fato
    doc.build(elementos)
    return response
# --- VIEW: APAGAR MEDIÇÃO (PROTEGIDA) ---
@login_required(login_url='login')
def apagar_medicao_view(request, id):
    # Busca a medição pelo ID e garante que pertence ao usuário logado
    from django.shortcuts import get_object_or_404
    medicao = get_object_or_404(Medicao, id=id, usuario=request.user)
    
    # Deleta do banco de dados
    medicao.delete()
    
    # Envia uma mensagem de aviso e redireciona para a dashboard
    messages.warning(request, 'Medição excluída com sucesso!')
    return redirect('dashboard')