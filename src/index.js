const stage = document.getElementById('stage');

stage.width = window.innerWidth; //전체화면
stage.height = window.innerHeight;

function intRand(start, end) {
    return Math.floor((Math.random() * (end-start+1)) + start);
}
function dist(p1, p2){
    return Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2);
}
const gameState = { //점수 초기화
    score: 0
};
document.getElementById('score').innerText = `점수: ${gameState.score}`; //점수 표시 초기화

class Renderer {
    entities = []; //엔티티 목록
    active = true; //렌더링 여부
    constructor(ctx){
        this.ctx = ctx;
        this.loop = this.loop.bind(this); //this.loop를 인자로 넘기기 위함
        requestAnimationFrame(this.loop) //루프 실행
    }
    loop(){
        this.update()
        this.render() 
        if(this.active) requestAnimationFrame(this.loop)
    }
    clear(){ //화면 지우기
        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    }
    update(){
        for(const entity of this.entities){ //모든 엔티티에 대하여
            for(const other of this.entities){ //다른 엔티티들을 참조한다.
                if(other.id == entity.id) continue; //자신이면 건너뛴다.
                if(entity.checkCollision(other)){ //충돌을 검사한다.
                    entity.onCollision(other)
                    other.onCollision(entity)
                }
            }
            entity.update() //업데이트 호출
        }
    }
    render(){
        this.clear() //화면 지우기
        for(const entity of this.entities){ //모든 엔티티를 렌더링한다.
            this.ctx.beginPath()
            this.ctx.save()
            entity.render()
            this.ctx.closePath()
            this.ctx.restore()
        }
    }
    spawn(entity){ //엔티티를 추가한다.
        this.entities.push(entity)
        entity.director = this;
    }
}
/**@abstract */
class Entity {
    constructor(id, x, y, radius){
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = radius;
    }
    /**@abstract */
    render(){} //필수
    /**@abstract */
    update(){} //필수
    /**
     * @param {Renderer} renderer
     */
    set director(renderer){ //렌더러를 정한다.
        this.renderer = renderer;
    }
    kill(){ //엔티티 목록에서 제거한다.
        this.renderer.entities = this.renderer.entities.filter(e => e.id != this.id)
    }
    checkCollision(target){ //충돌 검사
        return dist([this.x, this.y], [target.x, target.y]) <= target.radius + this.radius;
    }
    onCollision(entity){ //override this
        //pass
    }
}

class Obstacle extends Entity {
    static COUNTER = 0;
    static MOVE_SPEED = 10;
    constructor(type, x, y){
        super(`obstacle-${Obstacle.COUNTER}`, x, y, intRand(20, 50))
        this.type = type;
    }
    render(){
        this.renderer.ctx.fillStyle = 'green';
        this.renderer.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        this.renderer.ctx.fill()
    }
    update(){
        if(this.y > 900 || this.y < -150) this.kill() //화면을 크게 벗어난 경우 최적화를 위해 제거
        this.y += this.type == 'U' ? Obstacle.MOVE_SPEED : -Obstacle.MOVE_SPEED; //위쪽이냐 아래쪽이냐에 따라 이동 방향 결정
    }
}

class Player extends Entity {
    static MOVE_SPEED = 5;
    keys = {}; //현재 눌리는 키들
    constructor(x, y){
        super("player", x, y, 20)
        document.addEventListener('keydown', e => this.keys[e.key] = true) //키 눌림,떼짐 감지
        document.addEventListener('keyup', e => this.keys[e.key] = false)
    }
    update(){
        if(this.x <= 20) this.x += Player.MOVE_SPEED; //화면 밖으로 가려고 할 경우
        if(this.y >= 734) this.y -= Player.MOVE_SPEED;
        if(this.x >= 1516) this.x -= Player.MOVE_SPEED;
        if(this.y <= 20) this.y += Player.MOVE_SPEED; //막는다.

        if(this.keys.a) this.x -= Player.MOVE_SPEED; //이동 키
        if(this.keys.d) this.x += Player.MOVE_SPEED;
        if(this.keys.w) this.y -= Player.MOVE_SPEED;
        if(this.keys.s) this.y += Player.MOVE_SPEED;
    }
    render(){
        this.renderer.ctx.fillStyle = 'black';
        this.renderer.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        this.renderer.ctx.fill()
    }
    onCollision(){ //장애물에 닿았으면 게임을 끝낸다.
        alert('으악!')
        this.kill()
        this.renderer.active = false;
    }
}


const renderer = new Renderer(stage.getContext('2d'));

const player = new Player(window.innerWidth / 2, window.innerHeight / 2);

renderer.spawn(player) //플레이어를 화면에 추가한다.

setInterval(() => {
    if(!renderer.active) return; //게임이 이미 끝났을 경우

    const direc = intRand(0, 1) == 1 ? 'U'  :'D';
    Obstacle.COUNTER++; //장애물 카운터
    const obstacle = new Obstacle(direc, intRand(0, 1300), direc == 'U' ? -100 : 850); //새 장애물
    renderer.spawn(obstacle) //을 추가한다.

    if(gameState.score >= 1000) { //목표 점수를 넘긴 경우
        alert('이겼습니다!') //게임에서 이기고
        renderer.active = false; //종료한다.
    }
    gameState.score += intRand(10, 30); //스코어 추가
    document.getElementById('score').innerText = `점수: ${gameState.score}`; //스코어 표시 업데이트
}, 500)