(function(){
	function LittleDinosaur(options){
		//Laya.Stat.show(0, 0);
		this.curr_ani;
		
		this.to_x = 0;
		this.to_y = 0;
		this.last_x = 0;
		this.last_y = 0;
		this.speed_x = 0;
		this.speed_y = 0;
		this.degree = 0;

		this.direction = 1;
		this.prev_direction = 1;

		this.stop_moving = false;
		this.can_go = true;

		this.options = options;

		this.Laya = Laya;

		this.sound_volume = 5;
		this.sound_muted = false;
		Laya.SoundManager.setSoundVolume(3);


		this.rand_movement_executing = false;
		this.touched = false;
	
		this.getWindowSize()
		this.Loader = new Loader(this);
		console.log(this.Loader);

		var that = this;
		var loadSound = function(){
			that.music = Laya.SoundManager.playSound("sounds/background.mp3", 0);	
		}

		this.Loader.loadSoundAndDisplay("sounds/background.mp3", function(){loadSound();});		
		this.initLayaStage();
		this.Background = new Background(this);
		this.initDinosaur(); 
		this.setEvents();
		this.setButtons();
		this.setChangeOrientationEvent();
	};

	LittleDinosaur.prototype.getWindowSize = function(){
		this.width = window.innerWidth 
        	|| document.documentElement.clientWidth 
        	|| document.body.clientWidth;

        this.height = window.innerHeight
        	|| document.documentElement.clientHeight
        	|| document.body.clientHeight;
	};

	LittleDinosaur.prototype.initLayaStage = function(){
		this.stage_width = this.width;
		this.stage_height = this.height;

		this.Laya.init(this.stage_width, this.stage_height);
    	this.Laya.stage.scaleMode = Laya.Stage.SCALE_SHOWALL;
	};

	LittleDinosaur.prototype.initDinosaur = function(){
		var ani = [];

		this.ani = ani;

  		this.setAtlas("res/dinosaur/idle.json", 0);
	    this.setAtlas("res/dinosaur/front.json", 1);
	    this.setAtlas("res/dinosaur/between_front_and_right.json", 2);
	    this.setAtlas("res/dinosaur/right.json", 3);
	    this.setAtlas("res/dinosaur/between_back_and_right.json", 4);
	    this.setAtlas("res/dinosaur/back.json", 5);
	    this.setAtlas("res/dinosaur/between_back_and_left.json", 6);
	    this.setAtlas("res/dinosaur/left.json", 7);
	    this.setAtlas("res/dinosaur/between_front_and_left.json", 8);
	    this.setAtlas("res/dinosaur/from_front_to_back.json", 9);
	    this.setAtlas("res/dinosaur/from_back_to_front.json", 10);
	    this.setAtlas("res/dinosaur/eat.json", 11);
	    this.setAtlas("res/dinosaur/idle_play.json", 12);
	    this.setAtlas("res/dinosaur/front_walk_watch.json", 13);
	    this.setAtlas("res/dinosaur/between_front_and_right_walk_watch.json", 14);
	    this.setAtlas("res/dinosaur/between_front_and_left_walk_watch.json", 15);
	    this.setAtlas("res/dinosaur/between_back_and_right_stop_watch.json", 16);
	    this.setAtlas("res/dinosaur/between_back_and_left_stop_watch.json", 17);
	    this.setAtlas("res/dinosaur/back_stop_watch.json", 18);
	    this.setAtlas("res/dinosaur/right_tumble.json", 19);
	    this.setAtlas("res/dinosaur/left_tumble.json", 20);
	    this.setAtlas("res/dinosaur/donot_eat.json", 21);
	    this.setAtlas("res/dinosaur/idle_second_play.json", 22);
	    this.setAtlas("res/dinosaur/second_donot_eat.json", 23);
	};

	LittleDinosaur.prototype.loadAtlas = function(url, index){
    		console.log(index);
    		this.ani[index] = new this.Laya.Animation();
    		console.log(url);
    		this.ani[index].loadAtlas(url);
    		//console.log(ani);
    		this.Laya.stage.addChild(this.ani[index]);
    		this.ani[index].scale(1, 1);
    		this.ani[index].visible = false;
    		console.log(this.ani[index]);
    	};

    LittleDinosaur.prototype.setAtlas = function(url, index){
      		var that = this;
    		that.Loader.loadAtlasAndDisplay(url, function(){that.loadAtlas(url, index);});
    	};

	LittleDinosaur.prototype.initLastAnimation = function(){
		this.ani[0].visible = true;
    	this.ani[0].y = this.stage_height / 2 - 150;
	    this.ani[0].x = this.stage_width / 2 - 128;

	    this.curr_ani = this.ani[0];
 	    this.setDragonIdle();
	};

	LittleDinosaur.prototype.setEvents = function(){
		var canvas = document.getElementsByTagName("canvas")[0];

		var that = this;

    	canvas.addEventListener("touchstart", function(e) {that.onTouchStart(e);}); 
    	canvas.addEventListener("pointerDown", function(e) {that.onTouchStart(e);});
    	canvas.addEventListener("MSpointerDown", function(e) {that.onTouchStart(e);});
    	canvas.addEventListener("mousedown", function(e) {that.onTouchStart(e);});
	};

	LittleDinosaur.prototype.onTouchStart = function(e){
	    e = e || window.event;
    	e.preventDefault();

    	this.to_x = (e.type == "touchstart") ? e.touches[0].pageX : (e.x || e.pageX);
    	this.to_y = (e.type == "touchstart") ? e.touches[0].pageY : (e.y || e.pageY);

 	    this.to_x -= 128;
	    this.to_y -= 150;

	    this.touched = true;

	    if (!this.rand_movement_executing){
	    	this.goToPlace();
	    }
 	};

	LittleDinosaur.prototype.goToPlace = function(){
	    this.setButtonInactive();

	    this.calculateDeltas();
	    this.calculateDegreeDelta();
	    this.prev_direction = this.direction;    
	    this.direction = this.choseDirection();
	    this.changeDragonDirection(this.direction);
	    this.aproximateDirection(this.direction);
	    this.calculateSpeed();

	    this.max_rand_move_qnty = 3;
	    this.setRandomMovement(true);

	   	this.Laya.timer.frameLoop(1, this, this.animateHandler);
	};

	LittleDinosaur.prototype.playSounds = function(choice, loop, delay){
		var sound;

		//console.log("sound choice:" + choice);

		Laya.SoundManager.setSoundVolume(this.sound_volume);

		Laya.SoundManager.stopSound();

		switch　(choice){ 
			case 1: sound = "sounds/walk.mp3";
			        if (loop) {
			        	Laya.SoundManager.playSound(sound);
				    	this.sound_loop = setInterval(function(){Laya.SoundManager.playSound(sound);}, delay * 1000);
				    	//console.log("playSounds this.sound_loop:" + this.sound_loop);
				    }
				    break;
			case 2: sound = "sounds/walk_watch.mp3";
					//console.log(sound);
			        Laya.SoundManager.playSound(sound);				    	
				    break;

			case 3: sound = "sounds/tumble.mp3";
			        Laya.SoundManager.playSound(sound);				    	
				    break;

			case 4: sound = "sounds/stop_watch.mp3";
			        Laya.SoundManager.playSound(sound);				    	
				    break;

			case 5: sound = "sounds/eat.mp3";
					Laya.SoundManager.playSound(sound);				    	
				    break;

			case 6: sound = "sounds/return.mp3";
					this.turn_around_sound = Laya.SoundManager.playSound(sound);				    	
				    break;

			case 7: sound = "sounds/donot_eat.mp3";
					Laya.SoundManager.playSound(sound);				    	
				    break;

			case 8: sound = "sounds/donot_eat_2.mp3";
					Laya.SoundManager.playSound(sound);				    	
				    break;

			case 9: sound = "sounds/tumble_2.mp3";
			        Laya.SoundManager.playSound(sound);				    	
				    break;

			case 10: sound = "sounds/idle_play.mp3";
			        Laya.SoundManager.playSound(sound);				    	
				    break;

			case 11: sound = "sounds/idle_play_2.mp3";
			        Laya.SoundManager.playSound(sound);				    	
				    break;

			case 12: sound = "sounds/idle_second_play_1.mp3";
			        Laya.SoundManager.playSound(sound);				    	
				    break;

			case 13: sound = "sounds/idle_second_play_2.mp3";
			        Laya.SoundManager.playSound(sound);				    	
				    break;

			case 14: sound = "sounds/donot_eat_apple.mp3";
			        Laya.SoundManager.playSound(sound);				    	
				    break;

			case 15: sound = "sounds/donot_eat_banana.mp3";
			        Laya.SoundManager.playSound(sound);				    	
				    break;
		}
	};

	LittleDinosaur.prototype.stopSounds = function(){
		//console.log("stopSounds handler:" + this.sound_loop);
		if (this.sound_loop){
			clearInterval(this.sound_loop);
		}
	};

	LittleDinosaur.prototype.calculateDeltas = function(){
    	this.delta_x = this.to_x - this.curr_ani.x;
    	this.delta_y = this.to_y - this.curr_ani.y;
	};

	LittleDinosaur.prototype.calculateDegreeDelta = function(){
	    this.degree  = Math.atan2(this.delta_y, this.delta_x) * 180 / Math.PI;	    
	};

	LittleDinosaur.prototype.choseDirection = function(){
		if ((this.degree >= -22) && (this.degree < 22)){
		    return 3;
		} else 
		if ((this.degree >= 22) && (this.degree < 67)){
		    return 2;
		} else 
		if ((this.degree >= 67) && (this.degree < 112)){
		    return 1;
		} else 
		if ((this.degree >= 112) && (this.degree < 157)){
		    return 8;
		} else 
		if (((this.degree >= 157) && (this.degree <= 180)) || 
		   ((this.degree >= -180) && (this.degree < -157))){
		    return 7;
		} else 
		if ((this.degree >= -157) && (this.degree < -112)){
		    return 6;
		} else 
		if ((this.degree >= -112) && (this.degree < -67)){
		    return 5;
		} else
		if ((this.degree >= -67) && (this.degree < -22)){
		    return 4;
		}		
	};

	LittleDinosaur.prototype.changeDragonDirection = function(direction){
	    switch(direction){
	        case 1: this.initDragonMovements(this.ani[1]); break;
	        case 2: this.initDragonMovements(this.ani[2]);; break;
	        case 3: this.initDragonMovements(this.ani[3]); break;
	        case 4: this.initDragonMovements(this.ani[4]); break;
	        case 5: this.initDragonMovements(this.ani[5]); break;
	        case 6: this.initDragonMovements(this.ani[6]); break;
	        case 7: this.initDragonMovements(this.ani[7]); break;
	        case 8: this.initDragonMovements(this.ani[8]);
	    }
	};

	LittleDinosaur.prototype.initDragonMovements = function(ani, one_time, callback){
		//console.log("initDragonMovements");
	    var curr_x = 0;
	    var curr_y = 0;

	    curr_x = this.curr_ani.x; 
	    curr_y = this.curr_ani.y;
	    ani.x = curr_x; 
	    ani.y = curr_y;

	    if (this.idle_time){
	    	clearTimeout(this.idle_time);
	    	console.log("initDragonMovements clear this.idle_time:" + this.idle_time);
	    }

	    if (one_time){
	        ani.play(0, false);
	    } else {
	        ani.play();
	    }

	    this.curr_ani.visible = false;  
	    this.curr_ani = ani; 
	    this.curr_ani.visible = true;

	    var that = this;

	    if (callback){
	    	ani.on(Laya.Event.COMPLETE, this, function(){
	    		that.Laya.timer.clearAll(that);
	    		console.log("---complete");
	            callback.call(that);
	        });
	    }    
	};

	LittleDinosaur.prototype.aproximateDirection = function(direction){
    	this.distance = Math.sqrt((this.delta_x * this.delta_x) + (this.delta_y * this.delta_y));

	    switch (direction){
	        case 1: this.delta_x = 0; this.delta_y = this.distance; break;
	        case 2: this.delta_x = this.calculateX(this.distance, 45); this.delta_y = this.delta_x; break;
	        case 3: this.delta_x = this.distance; this.delta_y = 0; break;
	        case 4: this.delta_x = this.calculateX(this.distance, -45); this.delta_y = -this.delta_x; break;
	        case 5: this.delta_x = 0; this.delta_y = -this.distance; break;
	        case 6: this.delta_x = this.calculateX(this.distance, -135); this.delta_y = this.delta_x; break;
	        case 7: this.delta_x = -this.distance; this.delta_y = 0; break;
	        case 8: this.delta_x = this.calculateX(this.distance, 135); this.delta_y = -this.delta_x;
	    }
	};

	LittleDinosaur.prototype.calculateX = function(distance ,degree){
	    var x = distance * Math.sin(Math.abs(degree) * Math.PI / 180) ;

	    if (Math.abs(degree) > 90){
	        return -x;
	    } else {
	        return x;
	    }
	};

	LittleDinosaur.prototype.calculateSpeed = function(){
	    var times_qnty = this.distance / 2;

	    this.speed_x = this.delta_x / times_qnty;
	    this.speed_y = this.delta_y / times_qnty;
	};

	LittleDinosaur.prototype.backgroundToBeStoped = function(){
		var background = this.Background.background;
		var stop = false;

		if (this.delta_x){
	        if (this.delta_x > 0){
	            if (background.x <= (this.last_x - this.delta_x)){
	               stop = true;
	            }
	        } else {
	            if (background.x >= (this.last_x - this.delta_x)){
	              stop = true; 
	            }
	        }
	    } else {
	        if (this.delta_y > 0){
	            if (background.y <= (this.last_y - this.delta_y)){
	               stop = true; 
	            }
	        } else {
	            if (background.y >= (this.last_y - this.delta_y)){
	               stop = true;
	            }
	        }
	    }

	    if (!stop && this.isOutOfArea()){
	    	stop = true;
	    }

	    return stop;
	};

	LittleDinosaur.prototype.isOutOfArea = function(){
		var background_obj = this.Background;
 	    var background = background_obj.background;
 	    var scale = background_obj.scale;

 	    var half_stage_width = this.stage_width / 2;
 	    var half_stage_height = this.stage_height / 2;
		var move_area_x1 = background_obj.move_area_x1;
		var move_area_x2 = background_obj.move_area_x2;
		var move_area_y1 = background_obj.move_area_y1;
		var move_area_y2 = background_obj.move_area_y2;

	    switch (this.direction){
 	    	case 1: if ((background.y + move_area_y2) <= (half_stage_height + 50)){
 	    				return true;
 	    			};
 	    			break;
 	    	case 2: if ((background.y + move_area_y2) <= (half_stage_height + 50) ||
 	    		        (background.x + move_area_x2) <= (half_stage_width + 50)){
 	    				return true;
 	    			};
 	    			break;
 	    	case 3: if ((background.x + move_area_x2) <= (half_stage_width + 50)){
 	    				return true;
 	    			};
 	    			break;
 	    	case 4: if ((background.y + move_area_y1) >= (half_stage_height + 50 - (350 * scale)) ||
 	    		        (background.x + move_area_x2) <= (half_stage_width + 50)){
 	    				return true;
 	    			};
 	    			break;
 	    	case 5: if ((background.y + move_area_y1) >= (half_stage_height + 50 - (350 * scale))){
 	    				return true;
 	    			};
 	    			break;
 	    	case 6: if ((background.y + move_area_y1) >= (half_stage_height + 50 - (350 * scale)) ||
 	    		        (background.x + move_area_x1) >= (half_stage_width - 50)){
 	    				return true;
 	    			};
 	    			break;
 	    	case 7: if ((background.x + move_area_x1) >= (half_stage_width - 50)){
 	    				return true;
 	    			};
 	    			break;
 	    	case 8: if ((background.y + move_area_y2) <= (half_stage_height + 50) ||
 	    		        (background.x + move_area_x1) >= (half_stage_width - 50)){
 	    				return true;
 	    			};
 	    };

 	    return false;
	};

	LittleDinosaur.prototype.animateHandler = function(){ 
	    var stop_moving = false;
	    var background = this.Background.background;


	    console.log("ok 2");
	   	//this.sound_1.play(3, 1);
	    if (!this.backgroundToBeStoped()){
	    	//console("ok");
	    	////console.log("animateHandler move");
	    	background.x -= this.speed_x;
		    background.y -= this.speed_y;
		    //console(this.sound_1.play)
	  	    this.randomMove();
	    } else {
	    	this.last_x = background.x;
		    this.last_y = background.y;
		    //this.stopSounds();
	    	this.stopDragon(this.curr_ani);
	        this.Laya.timer.clearAll(this);
	    }
	};

	LittleDinosaur.prototype.fallDownBgAnimate = function(){
		var background = this.Background.background;
		background.x -= this.speed_x / 11;
		background.y -= this.speed_y / 11;
	}

	LittleDinosaur.prototype.walkLookAroundBgAnimate = function(){
		var background = this.Background.background;

		if (!this.isOutOfArea()){
			background.x -= this.speed_x;
			background.y -= this.speed_y;
		}
	}

	LittleDinosaur.prototype.randomMove = function(){
		var background = this.Background.background;
		var stop = false;
		var direction_class; // 1 - forward, 2 - right or left, 3 - backward

		////console.log("this.rand_move:" + this.rand_move);
		if (this.rand_move){
			if (this.delta_x_rand){
		        if (this.delta_x_rand > 0){
		            if (background.x <= (this.last_x - this.delta_x_rand)){
		               stop = true;
		            }
		        } else {
		            if (background.x >= (this.last_x - this.delta_x_rand)){
		              	stop = true; 
		            }
		        }
		    } else {
		        if (this.delta_y_rand > 0){
		            if (background.y <= (this.last_y - this.delta_y_rand)){
		               stop = true; 
		            }
		        } else {
		            if (background.y >= (this.last_y - this.delta_y_rand)){
		               stop = true;
		            }
		        }
		    }

		    var sound_type;

		    switch (this.direction){
		    	case 1:	case 2:	case 8: direction_class = 1; sound_type = 2; break;
		    	case 3:	case 7: direction_class = 2; sound_type = this.randomTumbleSound(); break;
		    	default: direction_class = 3; sound_type = 4;
		    }

		    if (stop){
		    	this.max_rand_move_qnty--;
		    	this.Laya.timer.clearAll(this);
				this.last_x = background.x;
				this.last_y = background.y;
				var that = this;
				var curr_ani = this.curr_ani;

				this.playSounds(sound_type);

				if (direction_class == 2){
					this.Laya.timer.frameLoop(1, this, this.fallDownBgAnimate);
				}

				if (direction_class == 1){
					this.Laya.timer.frameLoop(1, this, this.walkLookAroundBgAnimate);
				}

				this.rand_movement_executing = true;

				this.initDragonMovements(this.rand_move, true, function(){
					if ((direction_class == 1) || (direction_class == 2)){
						that.Laya.timer.clearAll(that);
					}

					that.rand_movement_executing = false;
					if (!that.touched){
						that.setRandomMovement();
						that.initDragonMovements(curr_ani);
			            that.Laya.timer.frameLoop(1, that, that.animateHandler);
		        	} else {
		        		that.touched = false;
		        		that.goToPlace();
		        	}
		     	})
			}
		}
	};

	LittleDinosaur.prototype.randomTumbleSound = function(){
		var rand_number = Math.random();

		if (rand_number <= 0.5){
			return 3;
		} else {
			return 9;
		}
	};

	LittleDinosaur.prototype.stopDragon = function(ani){
	    ani.stop();
	    this.turnDragon(0);
	};

	LittleDinosaur.prototype.turnDragon = function(turn_direction){
	    switch (this.direction){
	        case 1: this.setDragonIdle(); this.setButtonActive(); break;
	        case 2: this.setDragonIdle(); this.setButtonActive(); break;
	        case 3: this.setDragonIdle(); this.setButtonActive(); break;
	        case 4: this.setDragonIdle(); this.setButtonActive(); break;
	        case 5: var that = this;
	                this.playSounds(6); 
	                this.rand_movement_executing = true;
	                this.initDragonMovements(this.ani[10], true, function(){
	                    that.rand_movement_executing = false;
	                	if (!that.touched && !that.clicked){
	                		that.setButtonActive();
	                    	that.initDragonMovements(that.ani[0]);
	                    } else if　(that.touched){
	                    	that.touched = false;
	                    	that.goToPlace();
	                    } else {
	                    	that.clicked = false;
	                    	that.eatMeat();
	                    } 
	                }); break;
	        case 6: this.setDragonIdle(); this.setButtonActive(); break;
	        case 7: this.setDragonIdle(); this.setButtonActive(); break;
	        case 8: this.setDragonIdle(); this.setButtonActive(); break;
	    } 
	};

	LittleDinosaur.prototype.setRandomMovement = function(){
		this.rand_move = this.chooseRandomMove();

		if (this.rand_move){
			this.calculateRandDistance();
		}
	};

	LittleDinosaur.prototype.chooseRandomMove = function(){
		//var rand_number = this.randomNumber(1, 100);
		var rand_number = Math.random();
		var rand_boundary_low = 0.2; 
		var rand_boundary_high = 0.45;

		if ((rand_boundary_low <= rand_number) && (rand_number <= rand_boundary_high)){
			switch (this.direction){
				case 1: return this.ani[13];
				case 2: return this.ani[14]; //
				case 3: return this.ani[19];
				case 4: return this.ani[16];
				case 5: return this.ani[18];
				case 6: return this.ani[17];
				case 7: return this.ani[20];
				case 8: return this.ani[15];
			}
		} else {
			return null;
		}
	};

	LittleDinosaur.prototype.calculateRandDistance = function(){
		var distance = this.distance;
		var start_delta = 150 - (40 * (this.max_rand_move_qnty - 1));

		if ((this.distance - 10) > start_delta){
			var rand_distance = this.randomNumber(start_delta, this.distance - 20); 
		}

		switch (this.direction){
	        case 1: this.delta_x_rand = 0; this.delta_y_rand = rand_distance; break;
	        case 2: this.delta_x_rand = this.calculateX(rand_distance, 45); this.delta_y_rand = this.delta_x_rand; break;
	        case 3: this.delta_x_rand = rand_distance; this.delta_y_rand = 0; break;
	        case 4: this.delta_x_rand = this.calculateX(rand_distance, -45); this.delta_y_rand = -this.delta_x_rand; break;
	        case 5: this.delta_x_rand = 0; this.delta_y_rand = -rand_distance; break;
	        case 6: this.delta_x_rand = this.calculateX(rand_distance, -135); this.delta_y_rand = this.delta_x_rand; break;
	        case 7: this.delta_x_rand = -rand_distance; this.delta_y_rand = 0; break;
	        case 8: this.delta_x_rand = this.calculateX(rand_distance, 135); this.delta_y_rand = -this.delta_x;
	    }
	};

	LittleDinosaur.prototype.randomNumber = function(min, max){
		/*var min = parseInt(min);
  		var max = parseInt(max);*/
  		return Math.random() * (max - min) + min;
	};

	LittleDinosaur.prototype.eatMeat = function(){
		this.stopDragon(this.curr_ani);
	    var action = this.randChooseEatAction();
	    if (action == 11){	
	        this.playSounds(5);
	    } else if (action == 21) {
	    	this.playSounds(this.randEatAppleSound());
	    } else if (action == 23) {
	    	this.playSounds(this.randEatBananaSound());
	    }

	    this.rand_movement_executing = true;

	    var that = this; 	
	    this.initDragonMovements(this.ani[action], true, function(){
	    		that.rand_movement_executing = false;
	    		that.clicked = false;
	    		if (!that.touched && !that.clicked){
	               that.initDragonMovements(that.ani[0]);
	    		} else if (that.touched){
	    			that.touched = false;
	    			that.goToPlace();	
	    		} else {
	    			that.clicked = false;
	    			that.eatMeat();
	    		}
	    }); 
	};

	LittleDinosaur.prototype.randEatAppleSound = function(){
		var rand_number = Math.random();

		if (rand_number <= 0.5){
			return 7;
		} else {
			return 14;
		}
	};

	LittleDinosaur.prototype.randEatBananaSound = function(){
		var rand_number = Math.random();

		if (rand_number <= 0.5){
			return 8;
		} else {
			return 15;
		}
	};

	LittleDinosaur.prototype.runDragonIdle = function(){
		//console.log("runDragonIdle");
		var action = this.randChooseIdleSecondAction();
	    if (action == 12){	
	        this.randomIdleFirstSound();
	    } else 
	    if (action == 22){
	    	this.randomIdleSecondSound();
	    }

	    var that = this;
	    var time = this.randSetIdleSATime();
	    //var time = 15000;

	    console.log("clear this.idle_time:" + this.idle_time);

	    clearTimeout(this.idle_time);

	    console.log("time:" + time);

		this.rand_movement_executing = true;

		//console.log("runDragonIdle action:" + action);
		this.initDragonMovements(this.ani[action], true, function(){
			that.rand_movement_executing = false;
			if (!that.touched && !that.clicked){
				that.initDragonMovements(that.ani[0]);
				that.idle_time = setTimeout(function(){that.runDragonIdle();}, time);
			} else if (that.touched){
				that.touched = false;
	    		that.goToPlace();
			} else {
				that.clicked = false;
				that.eatMeat();
			}
			console.log("runDragonIdle this.idle_time:" + that.idle_time);
		});

	};

	LittleDinosaur.prototype.randomIdleFirstSound = function(){
		var rand_number = Math.random();

		if (rand_number <= 0.5){
			this.playSounds(10);
		} else {
			this.playSounds(11);
		}
	};

	LittleDinosaur.prototype.randomIdleSecondSound = function(){
		var rand_number = Math.random();

		if (rand_number <= 0.5){
			this.playSounds(12);
		} else {
			this.playSounds(13);
		}
	};

	LittleDinosaur.prototype.setDragonIdle = function(){
		//console.log("setDragonIdle");

		this.initDragonMovements(this.ani[0]);

		var that = this;
		var time = this.randSetIdleSATime();
		//console.log("time:" + time);
		this.idle_time = setTimeout(function(){that.runDragonIdle();}, time);
		console.log("this.idle_time:" + this.idle_time);
	};

	LittleDinosaur.prototype.setButtons = function(){
	    var button_1 = document.getElementById("eat_meat");
	    //var button_2 = document.getElementById("no_sound");
	    var button_2 = document.getElementById("sound");
	     var button_3= document.getElementById("share");

	    this.button_1 = button_1;
	    this.button_2 = button_2;
	    this.button_3 = button_3;

	    var that = this;
	    /*var moveMore = function(){
	    	that.initDragonMovements(that.ani[0], function(){that.initDragonMovements(that.ani[12]);});
	    };*/

	    if (document.addEventListener){
	        button_1.addEventListener("click", function(){
	        	that.clicked = true;
	        	console.log("that.rand_movement_executing:" + that.rand_movement_executing);
	        	if (!that.rand_movement_executing){
	        		that.eatMeat();
	        	}
	        });
	        button_2.addEventListener("click", function(){
	        	that.turnOnOffSound();});
	        button_3.addEventListener("click", function(){
	        	that.displayShare();});
	    } else {
	        button_1.attachEvent("onclick", function(){
	        	that.clicked = true; 
	        	if (!that.rand_movement_executing){
	        		that.eatMeat();
	        	}
	        });
	        button_2.attachEvent("onclick", function(){that.turnOnOffSound();});
	        button_3.attachEvent("onclick", function(){that.displayShare();});
	    }
	};

	LittleDinosaur.prototype.displayShare = function(){
		var share_container = document.createElement("div");
		share_container.style.position = "absolute";
		share_container.style.top = "0";
		share_container.style.left = "0";
        share_container.style.width = this.width + "px";
        share_container.style.height = this.height + "px";
        share_container.style.zIndex = "99999";
        share_container.style.background = "black";
        share_container.style.opacity = "0.6";
        document.documentElement.appendChild(share_container);

        var img = document.createElement("img");
        img.style.position = "absolute";
		img.style.top = "20px";
		img.style.right = "20px";
        img.style.width = "148px";
        img.style.height = "65px";
        img.src = "images/share_1.png";
        img.style.zIndex = "99999";
        document.documentElement.appendChild(img);

        setTimeout(function(){
        	document.documentElement.removeChild(share_container);
        	document.documentElement.removeChild(img);
        }, 2000);
	};

	LittleDinosaur.prototype.turnOnOffSound = function(){
		if (!this.sound_muted){
			this.sound_muted = true;
			this.turnOffSound();

		} else {
			console.log("ok");
			this.sound_muted = false;
			this.turnOnSound(); 
		}
	};

	LittleDinosaur.prototype.turnOffSound = function(){
		this.button_2.className = "no_sound";
	    this.music.stop();
		//this.sound_volume = 0;
	};

	LittleDinosaur.prototype.turnOnSound = function(){
		this.button_2.className = "sound";
	    this.music = Laya.SoundManager.playSound("sounds/background.mp3", 0);
		//this.sound_volume = 10;
	};

	LittleDinosaur.prototype.setButtonInactive = function(){
		this.button_1.style.visibility = "hidden";
	};

	LittleDinosaur.prototype.setButtonActive = function(){
		this.button_1.style.visibility = "visible";
	};

	LittleDinosaur.prototype.setChangeOrientationEvent = function(){
		var that = this;
		if (document.addEventListener){
			window.addEventListener("orientationchange", function(){console.log("ok"); /*that.Background.setBackroundSizePosition();*/});
		} else {

		};
	};

	LittleDinosaur.prototype.randChooseEatAction = function(){
		var rand_number = this.randomNumber(1, 9);

		if (rand_number <= 3){
			return 11;
		} else if (rand_number <= 6) {
			return 21;
		} else if (rand_number <= 9){
			return 23;
		}
	};

	LittleDinosaur.prototype.randChooseIdleSecondAction = function(){
		var rand_number = this.randomNumber(1, 10);

		if (rand_number <= 5){
			return 12;
		} else {
			return 22;
		}
	};

	LittleDinosaur.prototype.randSetIdleSATime = function(){
		return this.randomNumber(15000, 25000);
	};


	//-----------Background --------------

	function Background(little_dinosaur){
		this.little_dinosaur = little_dinosaur;
		this.full_width = little_dinosaur.options.bg_full_width;
		this.full_height = little_dinosaur.options.bg_full_height;
		this.area_width = little_dinosaur.options.area_width;
		this.area_height = little_dinosaur.options.area_height;
		this.area_x_offset = (this.full_width - this.area_width) / 2;
		this.area_y_offset = (this.full_height - this.area_height) / 2;

		var laya = little_dinosaur.Laya;

		this.Laya = laya;
		this.background = new laya.Sprite;
		this.background.loadImage("res/background/background.jpg");    
    	this.Laya.stage.addChild(this.background);    	
    	this.setBackroundSizePosition();

    	this.width = this.full_width * this.scale;
    	this.move_area_width = this.area_width * this.scale;
    	this.height = this.full_height * this.scale;
    	this.move_area_height = this.area_height * this.scale;
     	this.move_area_x1 = this.s_area_x_offset;
    	this.move_area_x2 = this.s_area_x_offset + this.move_area_width;
    	this.move_area_y1 = this.s_area_y_offset;
    	this.move_area_y2 = this.s_area_y_offset + this.move_area_height;
    };

	Background.prototype.setBackroundSizePosition = function(){
		var width = this.little_dinosaur.stage_width;
		var height = this.little_dinosaur.stage_height;

		var x_scale = width / this.area_width * 1.5;
		var y_scale = height / this.area_height * 1.5;
		
		var scale = (width > height) ? x_scale: y_scale;

		this.scale = scale;

		this.background.scale(scale, scale);

		this.s_area_x_offset = this.area_x_offset * scale;
		this.s_area_y_offset = this.area_y_offset * scale;

		if (width < height) {
			this.background.y = -this.s_area_y_offset * 1.3;
			this.background.x = -((this.full_width * scale) - width) / 2;
		} else {
			this.background.y = -((this.full_height * scale) - height) / 2;
			this.background.x = -this.s_area_x_offset;
		};

		
		this.little_dinosaur.last_x = this.background.x;
		this.little_dinosaur.last_y = this.background.y;
	};

	//-------Loader---------
	function Loader(little_dinosaur){
		this.percentage = 0;
		this.loaded_peace = 0;
		this.little_dinosaur = little_dinosaur;

		this.initLoader();
	};

	Loader.prototype.initLoader = function(){
		var little_dinosaur = this.little_dinosaur;
		console.log("ok");

		var loader_container = document.createElement("div");
		loader_container.style.position = "absolute";
		loader_container.style.top = "0";
		loader_container.style.left = "0";
        loader_container.style.width = little_dinosaur.width + "px";
        loader_container.style.height = little_dinosaur.height + "px";
        loader_container.style.zIndex = "99999";
        loader_container.style.background = "white";
        loader_container.style.lineHeight = little_dinosaur.height + "px";
        loader_container.style.textAlign = "center";
        loader_container.style.fontSize = "20px"
        loader_container.innerHTML = "Loaded 0%";
        document.documentElement.appendChild(loader_container);
        this.loader_container = loader_container;

        var loader_indicator = document.createElement("div");
        loader_indicator.style.position = "absolute";
        loader_indicator.style.height = "10px";
        loader_indicator.style.width = little_dinosaur.width + "px";
        loader_indicator.style.marginTop = (little_dinosaur.height / 100 * 60) + "px";
        loader_indicator.style.background = "yellow";
        loader_indicator.style.zIndex = "99999";
        document.documentElement.appendChild(loader_indicator);
        console.log(loader_indicator.parentElement);
        this.loader_indicator = loader_indicator;

        this.loader_indicators = [];
        for (var i = 0; i < 25; i++){
	        var loader_indicator_1 = document.createElement("div");
	        loader_indicator_1.style.height = "10px";
	        loader_indicator_1.style.width = (little_dinosaur.width / 25) + "px";
	        loader_indicator_1.style.float = "left";
	        loader_indicator.appendChild(loader_indicator_1);
	        this.loader_indicators[i] = loader_indicator_1;
    	}


	};

	Loader.prototype.loadAtlasAndDisplay = function(url, loadAtlasHandler){
		var that = this;
		Laya.loader.load(url, Laya.Handler.create(this, function(){loadAtlasHandler(); 
			that.displayLoadPercentage();}), null, Laya.Loader.ATLAS);
	};

	Loader.prototype.loadSoundAndDisplay = function(url, loadAtlasHandler){
		var that = this;
		Laya.loader.load(url, Laya.Handler.create(this, function(){loadAtlasHandler();  
			that.displayLoadPercentage();}), null, Laya.Loader.SOUND);
	};

	Loader.prototype.displayLoadPercentage = function(){
		this.percentage += 4;
		this.loader_container.innerHTML = "Loaded " + Math.floor(this.percentage) + "%";
		var peace = this.loader_indicators[this.loaded_peace++];
		peace.style.background = "blue";

		if (this.percentage >= 100){
			document.documentElement.removeChild(this.loader_container);
			document.documentElement.removeChild(this.loader_indicator);
			this.little_dinosaur.initLastAnimation();
			this.displayButtons();
		}
	};

	Loader.prototype.displayButtons = function(){
		var eat_meat = document.getElementById("eat_meat");
		var ar_site = document.getElementById("ar_site");
		var sound = document.getElementById("sound");
		var share = document.getElementById("share");

		eat_meat.style.visibility = "visible";
		ar_site.style.visibility = "visible";
		sound.style.visibility = "visible";
		share.style.visibility = "visible";

	};

	window.LittleDinosaur = LittleDinosaur;
})();